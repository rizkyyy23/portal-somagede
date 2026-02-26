import {
  AlertTriangle,
  Info,
  Megaphone,
  Send,
  Trash2,
  Clock,
  Radio,
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  X,
  Bell,
  Edit3,
  Inbox,
} from "lucide-react";
import "../../styles/admin-dashboard.css";
import { useState, useEffect } from "react";
import { useToast } from "../../contexts/ToastContext";
import { api } from "../../utils/api";
import "../../styles/DashboardAdmin.css";
import "../../styles/Broadcast.css";

const Broadcast = () => {
  const { showToast } = useToast();
  // activeBroadcasts: non-deleted ones (for Active Now tab)
  const [activeBroadcasts, setActiveBroadcasts] = useState([]);
  // historyBroadcasts: all broadcasts including soft-deleted (for All History tab)
  const [historyBroadcasts, setHistoryBroadcasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    priority: "normal",
    target_audience: "all",
    expires_at: "",
  });
  const [activeTab, setActiveTab] = useState("active");

  useEffect(() => {
    fetchAllData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch broadcasts currently visible to users (non-deleted AND non-expired)
  const fetchActiveBroadcasts = async () => {
    try {
      const t = Date.now();
      const data = await api.get(`/broadcasts/active?t=${t}`);
      if (data.success) setActiveBroadcasts(data.data);
    } catch (error) {
      console.error("Error fetching active broadcasts:", error);
    }
  };

  // Fetch ALL broadcasts history (including soft-deleted)
  const fetchHistoryBroadcasts = async () => {
    try {
      const t = Date.now();
      const data = await api.get(`/broadcasts/history?t=${t}`);
      if (data.success) setHistoryBroadcasts(data.data);
    } catch (error) {
      console.error("Error fetching broadcast history:", error);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchActiveBroadcasts(), fetchHistoryBroadcasts()]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    fetchAllData();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      showToast("Broadcast title is required", "warning");
      return;
    }
    if (formData.title.length > 200) {
      showToast("Title must be less than 200 characters", "warning");
      return;
    }
    if (!formData.message?.trim()) {
      showToast("Broadcast message is required", "warning");
      return;
    }
    if (formData.message.length > 1000) {
      showToast("Message must be less than 1000 characters", "warning");
      return;
    }

    setSending(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const result = await api.post("/broadcasts", {
        ...formData,
        admin_id: user.id,
      });

      if (result.success) {
        showToast("Broadcast sent successfully!", "success");
        setFormData({
          title: "",
          message: "",
          priority: "normal",
          target_audience: "all",
          expires_at: "",
        });
        fetchAllData();
      } else {
        showToast(result.message || "Failed to send broadcast", "error");
      }
    } catch (error) {
      console.error("Error sending broadcast:", error);
      showToast("Failed to send broadcast", "error");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = (id) => {
    setDeleteCandidate(id);
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) return;

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const result = await api.delete(
        `/broadcasts/${deleteCandidate}?admin_id=${user.id}`,
      );
      if (result.success) {
        showToast("Broadcast removed from active list (kept in history)", "success");
        // Refresh both lists so active no longer shows it, but history still does
        await fetchAllData();
        setDeleteCandidate(null);
      } else {
        showToast(result.message || "Failed to remove broadcast", "error");
      }
    } catch (error) {
      console.error("Error deleting broadcast:", error);
      showToast("Failed to remove broadcast", "error");
    }
  };

  const getPriorityConfig = (priority) => {
    switch (priority) {
      case "urgent":
        return {
          color: "#e74c3c",
          bg: "#feeff0",
          icon: AlertTriangle,
          label: "Urgent",
        };
      case "high":
        return {
          color: "#f1c40f",
          bg: "#fef9e7",
          icon: Info,
          label: "High Priority",
        };
      case "normal":
      default:
        return {
          color: "#2ecc71",
          bg: "#e8f8f5",
          icon: Megaphone,
          label: "Normal",
        };
    }
  };

  return (
    <div className="broadcast-container">
      <div className="section-header broadcast-main-header">
        <Radio size={28} />
        <div>
          <h2 className="broadcast-main-title">Broadcast Center</h2>
          <p className="broadcast-main-subtitle">
            Manage and send system-wide announcements
          </p>
        </div>
      </div>

      <div className="broadcast-grid">
        {/* COMPOSE SECTION */}
        <div className="broadcast-composer">
          <h3 className="broadcast-section-title">
            <Edit3 size={20} />
            Compose New Message
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="broadcast-form-group">
              <label className="broadcast-label">
                Message Title <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Title..."
                className="broadcast-input"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            <div
              className="broadcast-form-group"
              style={{ marginBottom: "24px" }}
            >
              <label className="broadcast-label">
                Priority Level <span style={{ color: "red" }}>*</span>
              </label>
              <div className="priority-selector">
                {["normal", "high", "urgent"].map((p) => {
                  const config = getPriorityConfig(p);
                  const isSelected = formData.priority === p;
                  const Icon = config.icon;
                  return (
                    <div
                      key={p}
                      onClick={() => setFormData({ ...formData, priority: p })}
                      className={`priority-option ${isSelected ? "selected" : ""}`}
                      data-priority={p}
                    >
                      <Icon size={18} />
                      <span className="priority-label">{config.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              className="broadcast-form-group"
              style={{ marginBottom: "24px" }}
            >
              <label className="broadcast-label">
                Message Content <span style={{ color: "red" }}>*</span>
              </label>
              <textarea
                placeholder="Type your message here..."
                className="broadcast-textarea"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                rows={6}
              />
            </div>

            <div
              className="broadcast-form-group"
              style={{ marginBottom: "32px" }}
            >
              <label className="broadcast-label">Target Audience</label>
              <select
                className="broadcast-select"
                value={formData.target_audience}
                onChange={(e) =>
                  setFormData({ ...formData, target_audience: e.target.value })
                }
              >
                <option value="all">All Users (Everyone)</option>
                <option value="admin">Admins Only</option>
                <option value="staff">Staff Only</option>
              </select>
            </div>

            <div
              className="broadcast-form-group"
              style={{ marginBottom: "32px" }}
            >
              <label className="broadcast-label">
                Expiration Date{" "}
                <span style={{ fontWeight: "400", color: "#7f8c8d" }}>
                  (Optional)
                </span>
              </label>
              <input
                type="datetime-local"
                className="broadcast-input"
                value={formData.expires_at}
                onChange={(e) =>
                  setFormData({ ...formData, expires_at: e.target.value })
                }
              />
              <p className="broadcast-help-text">
                If set, the broadcast will automatically disappear from user
                view after this time.
              </p>
            </div>

            <button type="submit" className="btn-send-broadcast" disabled={sending}
              style={{
                opacity: sending ? 0.7 : 1,
                cursor: sending ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
              }}
            >
              <Send size={20} />
              {sending ? "Sending..." : "Send Broadcast"}
            </button>
          </form>
        </div>

        {/* HISTORY SECTION */}
        <div className="broadcast-history-panel">
          <h3 className="broadcast-section-title">
            <Clock size={20} />
            Broadcast History
          </h3>

          <div className="broadcast-tabs">
            <button
              onClick={() => handleTabChange("active")}
              className={`broadcast-tab-btn ${activeTab === "active" ? "active" : ""}`}
            >
              Active Now
            </button>
            <button
              onClick={() => handleTabChange("history")}
              className={`broadcast-tab-btn ${activeTab === "history" ? "active" : ""}`}
            >
              All History
            </button>
          </div>

          <div className="broadcast-history-list">
            {loading ? (
              <p className="broadcast-empty">Loading history...</p>
            ) : (
              (() => {
                const now = new Date();
                // Use the correct data source for each tab
                const displayList =
                  activeTab === "active" ? activeBroadcasts : historyBroadcasts;

                if (displayList.length === 0) {
                  return (
                    <div className="broadcast-empty" style={{ padding: "40px 0" }}>
                      <Inbox
                        size={48}
                        style={{ opacity: 0.2, marginBottom: "16px" }}
                      />
                      <p>
                        {activeTab === "active"
                          ? "No active broadcasts at the moment"
                          : "No broadcast history found"}
                      </p>
                    </div>
                  );
                }

                return (
                  <>
                    <div
                      style={{
                        padding: "0 4px 8px",
                        fontSize: "11px",
                        color: "#94a3b8",
                        fontWeight: "500",
                        borderBottom: "1px solid #f1f5f9",
                        marginBottom: "4px",
                      }}
                    >
                      Showing {displayList.length} record
                      {displayList.length !== 1 ? "s" : ""}
                    </div>
                    {displayList.map((item) => {
                      const config = getPriorityConfig(item.priority);
                      const Icon = config.icon;
                      const isDeleted = !!item.deleted_at;
                      const isExpired =
                        !isDeleted &&
                        item.expires_at &&
                        new Date(item.expires_at) < now;

                      // Determine visual state
                      let statusLabel, statusBg, statusColor, borderColor;
                      if (isDeleted) {
                        statusLabel = "Deleted";
                        statusBg = "#fef2f2";
                        statusColor = "#ef4444";
                        borderColor = "#fca5a5";
                      } else if (isExpired) {
                        statusLabel = "Expired";
                        statusBg = "#f1f5f9";
                        statusColor = "#64748b";
                        borderColor = "#cbd5e1";
                      } else {
                        statusLabel = "Live";
                        statusBg = "#ecfdf5";
                        statusColor = "#10b981";
                        borderColor = config.color;
                      }

                      return (
                        <div
                          key={item.id}
                          className="broadcast-item"
                          style={{
                            borderLeft: `4px solid ${borderColor}`,
                            opacity: isDeleted || isExpired ? 0.8 : 1,
                          }}
                        >
                          <div className="broadcast-item-header">
                            <div
                              style={{
                                display: "flex",
                                gap: "10px",
                                alignItems: "start",
                                flex: 1,
                              }}
                            >
                              <div
                                className="broadcast-item-icon"
                                data-priority={item.priority}
                                style={{
                                  backgroundColor:
                                    isDeleted || isExpired
                                      ? "#f1f5f9"
                                      : config.bg,
                                  color:
                                    isDeleted || isExpired
                                      ? "#64748b"
                                      : config.color,
                                }}
                              >
                                <Icon size={14} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div className="broadcast-item-title-row">
                                  <h4 className="broadcast-item-title">
                                    {item.title}
                                  </h4>
                                  <span
                                    className="broadcast-status-pill"
                                    style={{
                                      backgroundColor: statusBg,
                                      color: statusColor,
                                    }}
                                  >
                                    {statusLabel}
                                  </span>
                                </div>
                                <span className="broadcast-time">
                                  Sent:{" "}
                                  {new Date(item.created_at).toLocaleDateString(
                                    "id-ID",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )}{" "}
                                  •{" "}
                                  {new Date(item.created_at).toLocaleTimeString(
                                    [],
                                    { hour: "2-digit", minute: "2-digit" },
                                  )}
                                </span>
                                {item.deleted_at && (
                                  <div
                                    className="broadcast-expiry"
                                    style={{ color: "#ef4444" }}
                                  >
                                    <Trash2 size={11} />
                                    Removed:{" "}
                                    {new Date(
                                      item.deleted_at,
                                    ).toLocaleString("id-ID", {
                                      day: "numeric",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                )}
                                {!item.deleted_at && item.expires_at && (
                                  <div
                                    className="broadcast-expiry"
                                    style={{
                                      color: isExpired ? "#94a3b8" : "#f59e0b",
                                    }}
                                  >
                                    <Clock size={11} />
                                    {isExpired ? "Expired: " : "Live until: "}
                                    {new Date(item.expires_at).toLocaleString(
                                      "id-ID",
                                      {
                                        day: "numeric",
                                        month: "short",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      },
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            {/* Only show delete button on Active tab for live items */}
                            {activeTab === "active" && !isDeleted && (
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="btn-delete-broadcast"
                                title="Remove from active broadcasts"
                                style={{ padding: "4px", borderRadius: "4px" }}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                          <p className="broadcast-message-preview">
                            {item.message}
                          </p>
                          <div
                            style={{
                              marginTop: "8px",
                              display: "flex",
                              gap: "8px",
                              alignItems: "center",
                            }}
                          >
                            <span className="broadcast-audience-tag">
                              To:{" "}
                              {item.target_audience === "all"
                                ? "Everyone"
                                : item.target_audience}
                            </span>
                            <span
                              style={{
                                fontSize: "9px",
                                color: "#94a3b8",
                                display: "flex",
                                alignItems: "center",
                                gap: "3px",
                              }}
                            >
                              <div
                                style={{
                                  width: "4px",
                                  height: "4px",
                                  borderRadius: "50%",
                                  backgroundColor: "#cbd5e1",
                                }}
                              />
                              Priority: {item.priority}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </>
                );
              })()
            )}
          </div>
        </div>
      </div>
      {/* DELETE CONFIRMATION MODAL */}
      {deleteCandidate && (
        <div
          className="confirm-dialog-overlay"
          onClick={() => setDeleteCandidate(null)}
        >
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-dialog-body">
              <div className="confirm-dialog-icon danger">
                <Trash2 />
              </div>
              <h3>Remove Broadcast?</h3>
              <p>
                This will remove the broadcast from the active view. Users will
                no longer see it. The record will remain in All History.
              </p>
            </div>
            <div className="confirm-dialog-footer">
              <button
                className="cd-btn cd-btn-cancel"
                onClick={() => setDeleteCandidate(null)}
              >
                Cancel
              </button>
              <button className="cd-btn cd-btn-danger" onClick={confirmDelete}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Broadcast;
