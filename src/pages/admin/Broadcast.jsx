import * as LucideIcons from "lucide-react";
import "../../styles/admin-dashboard.css";
import { useState, useEffect } from "react";
import { useToast } from "../../contexts/ToastContext";
import "../../styles/DashboardAdmin.css";
import "../../styles/Broadcast.css";

const API_URL = "/api";

const Broadcast = () => {
  const { showToast } = useToast();
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    priority: "normal", // normal, high, urgent
    target_audience: "all",
    expires_at: ""
  });
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'

  useEffect(() => {
    fetchBroadcasts();
  }, [activeTab]);

  const fetchBroadcasts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/broadcasts`);
      const data = await response.json();
      if (data.success) {
        setBroadcasts(data.data);
      }
    } catch (error) {
      console.error("Error fetching broadcasts:", error);
      showToast("Failed to fetch broadcasts", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      showToast("Please fill in all required fields", "warning");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const response = await fetch(`${API_URL}/broadcasts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, admin_id: user.id })
      });
      const result = await response.json();
      
      if (result.success) {
        showToast("Broadcast sent successfully!", "success");
        setFormData({ title: "", message: "", priority: "normal", target_audience: "all", expires_at: "" });
        fetchBroadcasts();
      } else {
        showToast(result.message || "Failed to send broadcast", "error");
      }
    } catch (error) {
      console.error("Error sending broadcast:", error);
      showToast("Failed to send broadcast", "error");
    }
  };

  const handleDelete = (id) => {
    setDeleteCandidate(id);
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) return;

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const response = await fetch(`${API_URL}/broadcasts/${deleteCandidate}?admin_id=${user.id}`, {
        method: "DELETE"
      });
      const result = await response.json();
      if (result.success) {
        showToast("Broadcast deleted successfully", "success");
        fetchBroadcasts();
        setDeleteCandidate(null);
      } else {
        showToast("Failed to delete broadcast", "error");
      }
    } catch (error) {
      console.error("Error sending broadcast:", error);
      showToast("Failed to delete broadcast", "error");
    }
  };


  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 'urgent':
        return { color: '#e74c3c', bg: '#feeff0', icon: LucideIcons.Megaphone, label: 'Urgent' };
      case 'high':
        return { color: '#f1c40f', bg: '#fef9e7', icon: LucideIcons.AlertTriangle, label: 'High Priority' };
      case 'normal':
      default:
        return { color: '#2ecc71', bg: '#e8f8f5', icon: LucideIcons.Info, label: 'Normal' };
    }
  };

  return (
    <div className="broadcast-container">
      <div className="section-header broadcast-main-header">
        <LucideIcons.Radio size={28} />
        <div>
          <h2 className="broadcast-main-title">Broadcast Center</h2>
          <p className="broadcast-main-subtitle">Manage and send system-wide announcements</p>
        </div>
      </div>

      <div className="broadcast-grid">
        
        {/* COMPOSE SECTION */}
        <div className="broadcast-composer">
          <h3 className="broadcast-section-title">
            <LucideIcons.Edit3 size={20} />
            Compose New Message
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div className="broadcast-form-group">
              <label className="broadcast-label">
                Message Title <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Ex: System Maintenance Notice"
                className="broadcast-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="broadcast-form-group" style={{ marginBottom: "24px" }}>
              <label className="broadcast-label">
                Priority Level <span style={{ color: "red" }}>*</span>
              </label>
              <div className="priority-selector">
                {['normal', 'high', 'urgent'].map((p) => {
                  const config = getPriorityConfig(p);
                  const isSelected = formData.priority === p;
                  const Icon = config.icon;
                  return (
                    <div
                      key={p}
                      onClick={() => setFormData({ ...formData, priority: p })}
                      className={`priority-option ${isSelected ? 'selected' : ''}`}
                      data-priority={p}
                    >
                      <Icon size={24} />
                      <span className="priority-label">
                        {config.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="broadcast-form-group" style={{ marginBottom: "24px" }}>
              <label className="broadcast-label">
                Message Content <span style={{ color: "red" }}>*</span>
              </label>
              <textarea
                placeholder="Type your message here..."
                className="broadcast-textarea"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={6}
              />
            </div>

            <div className="broadcast-form-group" style={{ marginBottom: "32px" }}>
               <label className="broadcast-label">
                Target Audience
              </label>
              <select 
                className="broadcast-select"
                value={formData.target_audience}
                onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
              >
                  <option value="all">All Users (Everyone)</option>
                  <option value="admin">Admins Only</option>
                  <option value="staff">Staff Only</option>
              </select>
            </div>

            <div className="broadcast-form-group" style={{ marginBottom: "32px" }}>
               <label className="broadcast-label">
                Expiration Date <span style={{ fontWeight: "400", color: "#7f8c8d" }}>(Optional)</span>
              </label>
              <input 
                type="datetime-local"
                className="broadcast-input"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              />
              <p className="broadcast-help-text">
                If set, the broadcast will automatically disappear from user view after this time.
              </p>
            </div>

            <button type="submit" className="btn-send-broadcast">
              <LucideIcons.Send size={20} />
              Send Broadcast
            </button>
          </form>
        </div>

        {/* HISTORY SECTION */}
        <div className="broadcast-history-panel">
          <h3 className="broadcast-section-title">
            <LucideIcons.Clock size={20} />
            Broadcast History
          </h3>

          <div className="broadcast-tabs">
            <button 
              onClick={() => setActiveTab('active')}
              className={`broadcast-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
            >
              Active
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`broadcast-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            >
              History
            </button>
          </div>

          <div className="broadcast-history-list">
            {loading ? (
                <p className="broadcast-empty">Loading...</p>
            ) : (() => {
                const now = new Date();
                const filteredBroadcasts = broadcasts.filter(b => {
                  if (activeTab === 'active') {
                    return !b.expires_at || new Date(b.expires_at) > now;
                  } else {
                    return true;
                  }
                });

                if (filteredBroadcasts.length === 0) {
                     return (
                        <div className="broadcast-empty">
                            <LucideIcons.Inbox size={48} style={{ opacity: 0.5, marginBottom: "10px" }} />
                            <p>No {activeTab} broadcasts</p>
                        </div>
                    );
                }

                return filteredBroadcasts.map((item) => {
                    const config = getPriorityConfig(item.priority);
                    const Icon = config.icon;
                    const isExpired = item.expires_at && new Date(item.expires_at) < now;
                    
                    return (
                        <div key={item.id} className="broadcast-item" style={{ 
                            opacity: isExpired && activeTab === 'history' ? 0.7 : 1
                        }}>
                            <div className="broadcast-item-header">
                                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                    <div className="broadcast-item-icon" data-priority={item.priority}>
                                        <Icon size={16} />
                                    </div>
                                    <div>
                                        <div className="broadcast-item-title-row">
                                          <h4 className="broadcast-item-title">{item.title}</h4>
                                          {activeTab === 'history' && (
                                          <span className="broadcast-status-pill" data-status={isExpired ? 'expired' : 'active'}>
                                              {isExpired ? 'Expired' : 'Active'}
                                          </span>
                                          )}
                                        </div>
                                        <span className="broadcast-time">
                                            {new Date(item.created_at).toLocaleDateString()} • {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                        {item.expires_at && (
                                          <div className="broadcast-expiry" data-expired={isExpired}>
                                            <LucideIcons.Clock size={12} />
                                            {isExpired ? 'Expired at: ' : 'Expires: '}{new Date(item.expires_at).toLocaleString()}
                                          </div>
                                        )}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleDelete(item.id)}
                                    className="btn-delete-broadcast"
                                    title="Delete"
                                >
                                    <LucideIcons.Trash2 size={16} />
                                </button>
                            </div>
                            <p className="broadcast-message-preview">
                                {item.message}
                            </p>
                            <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
                                <span className="broadcast-audience-tag">
                                    To: {item.target_audience === 'all' ? 'Everyone' : item.target_audience}
                                </span>
                            </div>
                        </div>
                    );
                })
            })()}
          </div>
        </div>

      </div>
      {/* DELETE CONFIRMATION MODAL */}
      {deleteCandidate && (
        <div className="modal-overlay" onClick={() => setDeleteCandidate(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-body">
              <div className="confirmation-icon danger">
                <LucideIcons.Trash2 size={24} />
              </div>
              <h3>Delete Broadcast?</h3>
              <p>
                Are you sure you want to delete this broadcast message? 
                This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="modal-btn modal-btn-secondary" onClick={() => setDeleteCandidate(null)}>
                Cancel
              </button>
              <button className="modal-btn modal-btn-danger" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Broadcast;
