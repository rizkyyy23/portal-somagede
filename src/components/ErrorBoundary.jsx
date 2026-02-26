import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/login";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 20,
              padding: "48px 40px",
              maxWidth: 440,
              width: "90%",
              textAlign: "center",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.08)",
              border: "1px solid #e2e8f0",
            }}
          >
            {/* Error Icon */}
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #fef2f2, #fee2e2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#1e293b",
                margin: "0 0 8px",
              }}
            >
              Oops! Terjadi Kesalahan
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "#64748b",
                lineHeight: 1.6,
                margin: "0 0 32px",
              }}
            >
              Halaman mengalami error yang tidak terduga. Silakan muat ulang
              halaman atau kembali ke beranda.
            </p>

            {/* Error details (dev only) */}
            {process.env.NODE_ENV !== "production" && this.state.error && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 10,
                  padding: "12px 16px",
                  marginBottom: 24,
                  textAlign: "left",
                  fontSize: 12,
                  color: "#991b1b",
                  fontFamily: "monospace",
                  maxHeight: 120,
                  overflow: "auto",
                  wordBreak: "break-word",
                }}
              >
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={this.handleGoHome}
                style={{
                  padding: "10px 24px",
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  color: "#64748b",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f8fafc";
                  e.currentTarget.style.borderColor = "#cbd5e1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
              >
                Kembali
              </button>
              <button
                onClick={this.handleReload}
                style={{
                  padding: "10px 24px",
                  background: "#3b82f6",
                  border: "none",
                  borderRadius: 10,
                  color: "white",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#2563eb";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#3b82f6";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Muat Ulang
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
