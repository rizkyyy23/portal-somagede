import { useState, useEffect } from "react";
import { useToast } from "../../contexts/ToastContext";
import "../../styles/admin-dashboard.css";
import "../../styles/DashboardAdmin.css";
import "../../styles/MasterData.css";

const API_URL = "/api";

const ActiveSession = () => {
  const { showToast } = useToast();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [departments, setDepartments] = useState([]);
  const itemsPerPage = 7;

  useEffect(() => {
    fetchSessions();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${API_URL}/departments`);
      const result = await response.json();
      if (result.success) {
        setDepartments(result.data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.user_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          session.user_email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === "" || session.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/sessions`);
      const result = await response.json();
      if (result.success) {
        setSessions(result.data);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = (name) => {
    if (!name) return "??";
    const names = name.split(" ");
    if (names.length === 1) return name.substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  const getInitialsColor = (name) => {
    const colors = [
      { bg: "#e3f2fd", color: "#4a90e2" },
      { bg: "#ffebee", color: "#e74c3c" },
      { bg: "#e8f5e9", color: "#27ae60" },
      { bg: "#f3e5f5", color: "#9b59b6" },
      { bg: "#fff3e0", color: "#f39c12" },
      { bg: "#e0f7fa", color: "#00bcd4" },
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const handleForceLogout = (session) => {
    setSelectedSession(session);
    setShowConfirmModal(true);
  };

  const confirmForceLogout = async () => {
    try {
      await fetch(`${API_URL}/sessions/${selectedSession.id}`, { method: 'DELETE' });
      fetchSessions();
      showToast(`${selectedSession.user_name} has been successfully logged out.`, "success");
    } catch (error) {
      showToast("Failed to force logout.", "error");
    }
    setShowConfirmModal(false);
    setSelectedSession(null);
  };

  const getDeptColor = (deptName) => {
    const dept = departments.find(d => d.name === deptName);
    return dept?.color || '#6366f1'; // Default to Indigo if not found
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
  };

  const formatDuration = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="session-section">
      <div className="section-header">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10" />
          <path fill="white" d="M12 6v6l4 2" />
        </svg>
        <h2>All Active Sessions ({sessions.length})</h2>
      </div>

      <div className="search-bar-container">
        <div className="search-bar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            placeholder="Search user..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <select 
          className="dept-filter-select"
          value={deptFilter}
          onChange={(e) => {
            setDeptFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">All Departments</option>
          {departments.map(dept => (
            <option key={dept.id} value={dept.name}>{dept.name}</option>
          ))}
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Department</th>
              <th>Active App</th>
              <th>IP Address</th>
              <th>Start Time</th>
              <th>Duration</th>
              <th>Security</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="empty-state">
                  Loading sessions...
                </td>
              </tr>
            ) : filteredSessions.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-state">
                  {searchQuery ? "No matching sessions found" : "No active sessions"}
                </td>
              </tr>
            ) : (
              filteredSessions
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((session) => {
                const initials = getUserInitials(session.user_name);
                const colors = getInitialsColor(session.user_name);
                return (
                  <tr key={session.id}>
                    <td>
                      <div className="user-cell">
                        <div
                          className="user-avatar"
                          style={{ background: colors.bg, color: colors.color }}
                        >
                          {initials}
                        </div>
                        <div className="user-info">
                          <h4>{session.user_name}</h4>
                          <p>{session.user_email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`role-badge ${(session.role || 'user').toLowerCase()}`}
                      >
                        {session.role || 'User'}
                      </span>
                    </td>
                      <td>
                        <span 
                          className="dept-badge"
                          style={{
                            backgroundColor: `${getDeptColor(session.department)}26`,
                            color: getDeptColor(session.department)
                          }}
                        >
                          {session.department}
                        </span>
                      </td>
                    <td>{session.app_name || 'Portal'}</td>
                    <td>{session.ip_address}</td>
                    <td>{formatTime(session.login_at)}</td>
                    <td>{formatDuration(session.login_at)}</td>
                    <td>
                      <button
                        className="force-logout-btn"
                        onClick={() => handleForceLogout(session)}
                      >
                        Force Logout
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && filteredSessions.length > 0 && (
        <div className="pagination-container">
          <span className="pagination-info">
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredSessions.length)} - {Math.min(currentPage * itemsPerPage, filteredSessions.length)} of {filteredSessions.length} active sessions
          </span>
          
          <div className="pagination-controls">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            
            <span className="page-indicator">
              Page {currentPage}
            </span>
            
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredSessions.length / itemsPerPage)))} 
              disabled={currentPage >= Math.ceil(filteredSessions.length / itemsPerPage)}
              className="pagination-btn"
            >
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* FORCE LOGOUT CONFIRMATION MODAL */}
      {showConfirmModal && selectedSession && (
        <div
          className="modal-overlay confirmation-modal"
          onClick={() => setShowConfirmModal(false)}
        >
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-body">
              <div className="confirmation-icon warning">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <h3>Force Logout User?</h3>
              <p>
                Are you sure you want to terminate the session for{" "}
                <strong>{selectedSession.user_name}</strong>? This will immediately
                disconnect them from <strong>{selectedSession.app_name || 'Portal'}</strong> and
                they will need to log in again.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="modal-btn modal-btn-secondary"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                className="modal-btn modal-btn-danger"
                onClick={confirmForceLogout}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Force Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveSession;
