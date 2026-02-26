import db from "../config/database.js";

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
