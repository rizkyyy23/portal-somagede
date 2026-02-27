import db from "../config/database.js";

// Auto-create login_history table if not exists
const initLoginHistory = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS login_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        user_email VARCHAR(255) DEFAULT '',
        department VARCHAR(100) DEFAULT '',
        role VARCHAR(50) DEFAULT 'User',
        ip_address VARCHAR(45) DEFAULT '0.0.0.0',
        app_name VARCHAR(100) DEFAULT 'Portal',
        login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user (user_id),
        INDEX idx_login_at (login_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  } catch (error) {
    console.error("Error creating login_history table:", error);
  }
};
initLoginHistory();

// GET all active sessions
export const getAllSessions = async (req, res) => {
  try {
    const [sessions] = await db.query(
      "SELECT s.*, u.avatar as user_avatar FROM active_sessions s LEFT JOIN users u ON s.user_id = u.id ORDER BY s.login_at DESC",
    );
    res.json({ success: true, data: sessions });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch sessions" });
  }
};

// CREATE session (called on login)
export const createSession = async (req, res) => {
  try {
    const {
      user_id,
      user_name,
      user_email,
      department,
      role,
      ip_address,
      app_name,
    } = req.body;

    // Clean up any existing sessions for this user before creating a new one
    // This prevents stale/duplicate sessions from accumulating
    if (user_id) {
      await db.query("DELETE FROM active_sessions WHERE user_id = ?", [user_id]);
    }

    const [result] = await db.query(
      "INSERT INTO active_sessions (user_id, user_name, user_email, department, role, ip_address, app_name) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        user_id || null,
        user_name,
        user_email || "",
        department || "",
        role || "User",
        ip_address || "0.0.0.0",
        app_name || "Portal",
      ],
    );

    // Also record in login_history for permanent tracking
    try {
      await db.query(
        "INSERT INTO login_history (user_id, user_name, user_email, department, role, ip_address, app_name) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          user_id || null,
          user_name,
          user_email || "",
          department || "",
          role || "User",
          ip_address || "0.0.0.0",
          app_name || "Portal",
        ],
      );
    } catch (historyError) {
      console.error("Error recording login history:", historyError);
    }

    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    console.error("Error creating session:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create session" });
  }
};

// DELETE session (force logout)
export const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM active_sessions WHERE id = ?", [id]);
    res.json({ success: true, message: "Session terminated" });
  } catch (error) {
    console.error("Error deleting session:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to terminate session" });
  }
};

// DELETE sessions by user_id (cleanup on logout)
export const deleteSessionByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    await db.query("DELETE FROM active_sessions WHERE user_id = ?", [userId]);
    res.json({ success: true, message: "User sessions cleaned up" });
  } catch (error) {
    console.error("Error cleaning up sessions:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to cleanup sessions" });
  }
};

// GET sessions by user_id (for profile page)
export const getUserSessions = async (req, res) => {
  try {
    const { userId } = req.params;
    const [sessions] = await db.query(
      "SELECT * FROM active_sessions WHERE user_id = ? ORDER BY login_at DESC",
      [userId],
    );
    res.json({ success: true, data: sessions });
  } catch (error) {
    console.error("Error fetching user sessions:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch user sessions" });
  }
};

// GET login history for a user (for profile page - recent activity)
export const getLoginHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const [history] = await db.query(
      "SELECT * FROM login_history WHERE user_id = ? ORDER BY login_at DESC LIMIT 20",
      [userId],
    );
    res.json({ success: true, data: history });
  } catch (error) {
    console.error("Error fetching login history:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch login history" });
  }
};

// GET dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    // User count by department
    const [deptCounts] = await db.query(`
      SELECT department, COUNT(*) as count 
      FROM users WHERE status = 'active' 
      GROUP BY department ORDER BY department
    `);

    // Total active users
    const [totalActive] = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE status = 'active'",
    );

    // Total users (all statuses)
    const [totalUsers] = await db.query("SELECT COUNT(*) as count FROM users");

    // Total active applications (only count applications with status = 'active')
    const [totalApps] = await db.query(
      "SELECT COUNT(*) as count FROM applications WHERE status = 'active'",
    );

    // Total departments
    const [totalDepts] = await db.query(
      "SELECT COUNT(*) as count FROM departments",
    );

    // Active session count
    const [sessionCount] = await db.query(
      "SELECT COUNT(*) as count FROM active_sessions",
    );

    // Active sessions by department breakdown
    const [activeSessionsByDept] = await db.query(`
      SELECT department, COUNT(*) as count 
      FROM active_sessions 
      GROUP BY department 
      ORDER BY count DESC
    `);

    // Top applications based on current active sessions (excluding Portal)
    const [topActiveApps] = await db.query(`
      SELECT app_name as name, COUNT(*) as value
      FROM active_sessions
      WHERE app_name != 'Portal'
      GROUP BY app_name
      ORDER BY value DESC
      LIMIT 5
    `);

    // Recent 3 sessions for dashboard preview
    const [recentSessions] = await db.query(
      "SELECT s.*, u.avatar as user_avatar FROM active_sessions s LEFT JOIN users u ON s.user_id = u.id ORDER BY s.login_at DESC LIMIT 3",
    );

    res.json({
      success: true,
      data: {
        departmentStats: deptCounts,
        totalActiveUsers: totalActive[0].count,
        totalUsers: totalUsers[0].count,
        totalApplications: totalApps[0].count,
        totalDepartments: totalDepts[0].count,
        activeSessionCount: sessionCount[0].count,
        activeSessionsByDept: activeSessionsByDept,
        topActiveApps: topActiveApps,
        recentSessions: recentSessions,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
};
