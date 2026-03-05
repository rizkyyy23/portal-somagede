import { useEffect, useRef, useCallback } from "react";

/**
 * useIdleTimeout — UX layer untuk deteksi inaktivitas user.
 *
 * ⚠️ INI BUKAN SECURITY ENFORCEMENT.
 * Security idle timeout di-enforce oleh backend (cek last_activity di setiap request).
 * Hook ini hanya untuk UX: menampilkan warning/overlay SEBELUM backend reject request.
 * Tanpa hook ini pun, backend tetap akan return 401 kalau user idle >30 menit.
 *
 * Cara kerja:
 * 1. Mulai timer saat hook aktif
 * 2. Setiap ada aktivitas user (mouse, keyboard, scroll, touch, click),
 *    timer di-reset ulang
 * 3. Kalau timer habis tanpa aktivitas → panggil onIdle callback (tampilkan overlay)
 * 4. Saat tab disembunyikan (visibilitychange), cek apakah sudah idle terlalu lama
 *
 * @param {Function} onIdle — Callback saat user idle (untuk tampilkan overlay)
 * @param {number} timeout — Timeout dalam milidetik (default: 30 menit)
 * @param {boolean} enabled — Aktifkan/nonaktifkan hook (default: true)
 */
export function useIdleTimeout(
  onIdle,
  timeout = 30 * 60 * 1000,
  enabled = true,
) {
  const timerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (enabled) {
      timerRef.current = setTimeout(() => {
        onIdle();
      }, timeout);
    }
  }, [onIdle, timeout, enabled]);

  useEffect(() => {
    if (!enabled) return;

    // Events yang dianggap "aktivitas user"
    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    // Throttle: hanya reset timer maksimal 1x per detik
    let throttled = false;
    const handleActivity = () => {
      if (throttled) return;
      throttled = true;
      resetTimer();
      setTimeout(() => {
        throttled = false;
      }, 1000);
    };

    // Saat tab kembali visible, cek apakah sudah idle terlalu lama
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const elapsed = Date.now() - lastActivityRef.current;
        if (elapsed >= timeout) {
          onIdle();
        } else {
          resetTimer();
        }
      }
    };

    // Pasang semua listener
    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Mulai timer pertama
    resetTimer();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, timeout, onIdle, resetTimer]);
}
