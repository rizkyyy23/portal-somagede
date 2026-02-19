import React, { useEffect, useState } from "react";

const Toast = ({ message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // Wait for exit animation to finish before unmounting
    setTimeout(onClose, 300);
  };

  // Icon mapping with enhanced designs
  const getIcon = () => {
    switch (type) {
      case "success":
        return (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        );
      case "error":
        return (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        );
      case "warning":
        return (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        );
      default: // info
        return (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        );
    }
  };

  const getStyles = () => {
    const baseStyle = {
      display: "flex",
      alignItems: "center",
      gap: "14px",
      padding: "16px 20px",
      borderRadius: "12px",
      backgroundColor: "white",
      color: "#1e293b",
      boxShadow:
        "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      border: "1px solid",
      minWidth: "340px",
      maxWidth: "480px",
      marginBottom: "12px",
      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      opacity: isVisible ? 1 : 0,
      transform: isVisible
        ? "translateX(0) scale(1)"
        : "translateX(100%) scale(0.95)",
      fontSize: "14px",
      fontWeight: "500",
      pointerEvents: "auto",
      position: "relative",
      overflow: "hidden",
    };

    switch (type) {
      case "success":
        return {
          ...baseStyle,
          borderColor: "#cbd5e1", // abu-abu
          backgroundColor: "#f3f4f6", // abu-abu terang
        };
      case "error":
        return {
          ...baseStyle,
          borderColor: "#ef4444",
          backgroundColor: "#fef2f2",
        };
      case "warning":
        return {
          ...baseStyle,
          borderColor: "#f59e0b",
          backgroundColor: "#fffbeb",
        };
      default:
        return {
          ...baseStyle,
          borderColor: "#3b82f6",
          backgroundColor: "#eff6ff",
        };
    }
  };

  const getIconColor = () => {
    switch (type) {
      case "success":
        return "#64748b"; // abu-abu
      case "error":
        return "#ef4444";
      case "warning":
        return "#f59e0b";
      default:
        return "#3b82f6";
    }
  };

  const getIconBgStyle = () => {
    switch (type) {
      case "success":
        return {
          backgroundColor: "#e5e7eb", // abu-abu
          padding: "8px",
          borderRadius: "10px",
          display: "flex",
        };
      case "error":
        return {
          backgroundColor: "#fee2e2",
          padding: "8px",
          borderRadius: "10px",
          display: "flex",
        };
      case "warning":
        return {
          backgroundColor: "#fef3c7",
          padding: "8px",
          borderRadius: "10px",
          display: "flex",
        };
      default:
        return {
          backgroundColor: "#dbeafe",
          padding: "8px",
          borderRadius: "10px",
          display: "flex",
        };
    }
  };

  return (
    <div style={getStyles()}>
      <div style={{ ...getIconBgStyle(), color: getIconColor() }}>
        {getIcon()}
      </div>
      <div style={{ flex: 1, color: "#334155", lineHeight: "1.5" }}>
        {message}
      </div>
      <button
        onClick={handleClose}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#94a3b8",
          padding: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "6px",
          transition: "all 0.2s",
          minWidth: "28px",
          height: "28px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#f1f5f9";
          e.currentTarget.style.color = "#475569";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = "#94a3b8";
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  );
};

export default Toast;
