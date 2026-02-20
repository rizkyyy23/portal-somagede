import bcrypt from "bcryptjs";
import pool from "../config/database.js";
import { logActivity, logAudit } from "../utils/logger.js";

// Get all users (active and inactive)
export const getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.position,
        u.department,
        u.role,
        u.status,
        u.avatar,
        u.has_privilege,
        up.accessible_app_count,
        up.accessible_app_codes,
        up.extra_application_ids,
        up.default_application_ids,
        u.created_at,
        u.updated_at
      FROM users u
      LEFT JOIN user_privileges up ON u.id = up.user_id
      ORDER BY u.name ASC
    `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
};

// Get active users only
export const getActiveUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.position,
        u.department,
        u.role,
        u.status,
        u.avatar,
        u.has_privilege,
        up.accessible_app_count,
        up.accessible_app_codes,
        up.extra_application_ids,
        up.default_application_ids,
        u.created_at,
        u.updated_at
      FROM users u
      LEFT JOIN user_privileges up ON u.id = up.user_id
      WHERE u.status = 'active'
      ORDER BY name ASC
    `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching active users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching active users",
      error: error.message,
    });
  }
};

// Get inactive users
export const getInactiveUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.position,
        u.department,
        u.role,
        u.status,
        u.has_privilege,
        u.avatar,
        up.accessible_app_count,
        up.accessible_app_codes,
        up.extra_application_ids,
        up.default_application_ids,
        u.created_at,
        u.updated_at
      FROM users u
      LEFT JOIN user_privileges up ON u.id = up.user_id
      WHERE u.status = 'inactive'
      ORDER BY name ASC
    `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching inactive users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching inactive users",
      error: error.message,
    });
  }
};

// Get admin users (users with role = Admin)
export const getAdminUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.position, u.department, u.role, u.status, u.avatar,
        u.created_at, u.updated_at,
        up.accessible_app_count,
        up.accessible_app_codes,
        up.extra_application_ids,
        up.default_application_ids
      FROM users u
      LEFT JOIN user_privileges up ON u.id = up.user_id
      WHERE u.role = 'Admin'
      ORDER BY u.name ASC
    `);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error fetching admin users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching admin users",
      error: error.message,
    });
  }
};

// Get privilege users (users with has_privilege = 1)
export const getPrivilegeUsers = async (req, res) => {
  try {
    // Optimized: Get users and their override count in one query
    const [rows] = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.position, u.department, u.role, u.status, u.avatar, 
        u.has_privilege,
        up.accessible_app_count,
        up.extra_app_count,
        up.limit_app_count,
        up.extra_application_ids
      FROM users u
      LEFT JOIN user_privileges up ON u.id = up.user_id
      WHERE u.has_privilege = 1
      ORDER BY u.name ASC
    `);

    // Map to ensure boolean type for has_privilege and calculate overrides
    const result = rows.map((user) => ({
      ...user,
      has_privilege: user.has_privilege == 1 || user.has_privilege === "true",
      overrides: user.extra_application_ids
        ? user.extra_application_ids.split(",").length
        : 0,
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching privilege users:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch privilege users" });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT 
        id,
        employee_id,
        name,
        email,
        phone,
        position,
        department,
        role,
        status,
        avatar,
        password_changed_at,
        created_at,
        updated_at
      FROM users 
      WHERE id = ?
    `,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: error.message,
    });
  }
};

// Create new user
export const createUser = async (req, res) => {
  try {
    const { name, email, position, department, role, status, password } =
      req.body;

    const avatar = req.file ? `/uploads/icons/${req.file.filename}` : null;

    // Validate required fields
    if (!name || !email || !department) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and department are required",
      });
    }

    // Check for duplicate email
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email],
    );
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    // Hash password if provided, otherwise set default
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = password ? await bcrypt.hash(password, salt) : null;

    const [result] = await pool.query(
      `
      INSERT INTO users (name, email, position, department, role, status, avatar, password)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        name,
        email,
        position || "Staff",
        department,
        role || "User",
        status || "active",
        avatar,
        hashedPassword,
      ],
    );

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        id: result.insertId,
        name,
        email,
        position: position || "Staff",
        department,
        role: role || "User",
        status: status || "active",

        avatar,
      },
    });

    // unexpected: just fire and forget syncing accessible apps
    syncUserAccessibleApps(result.insertId).catch((err) =>
      console.error("Error syncing initial apps:", err),
    );
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      message: "Error creating user",
      error: error.message,
    });
  }
};

// Helper: Sync accessible_app_count and accessible_app_codes for a user
export const syncUserAccessibleApps = async (userId) => {
  // Get User Dept and Privileges
  const [rows] = await pool.query(
    `SELECT u.department, up.default_application_ids, up.default_application_codes, up.extra_application_ids, up.extra_application_codes 
     FROM users u
     LEFT JOIN user_privileges up ON u.id = up.user_id
     WHERE u.id = ?`,
    [userId],
  );

  if (rows.length === 0) return;

  const row = rows[0];
  let accessibleAppIds = [];
  let accessibleAppCodes = [];

  let limitAppIdsStr = null;
  let limitAppCodesStr = null;
  let limitAppCount = 0;

  // 1. Resolve Defaults
  if (row.default_application_ids !== null) {
    // User has specific defaults set (Active Defaults)
    accessibleAppIds = row.default_application_ids
      ? row.default_application_ids.split(",").map(Number)
      : [];
    accessibleAppCodes = row.default_application_codes
      ? row.default_application_codes.split(",")
      : [];
  }

  // Calculate Limits by comparing Active Defaults with Full Dept Defaults
  // Fetch Dept Defaults
  const [deptRows] = await pool.query(
    "SELECT allowed_apps FROM departments WHERE name = ?",
    [row.department],
  );
  if (deptRows.length > 0 && deptRows[0].allowed_apps) {
    const rawApps = deptRows[0].allowed_apps;
    let parsedApps = [];
    try {
      parsedApps = JSON.parse(rawApps);
    } catch (e) {
      parsedApps = rawApps.split(",").map((c) => c.trim());
    }

    let fullDefIds = [];
    let fullDefCodes = [];

    if (Array.isArray(parsedApps) && parsedApps.length > 0) {
      const isIds = parsedApps.every((item) => !isNaN(Number(item)));

      if (isIds) {
        fullDefIds = parsedApps.map(Number);
        const [apps] = await pool.query(
          "SELECT code FROM applications WHERE id IN (?)",
          [fullDefIds],
        );
        fullDefCodes = apps.map((a) => a.code);
      } else {
        const [apps] = await pool.query(
          "SELECT id, code FROM applications WHERE code IN (?)",
          [parsedApps],
        );
        fullDefIds = apps.map((a) => a.id);
        fullDefCodes = apps.map((a) => a.code);
      }
    }

    // If user has NO row or default__ids is NULL, they get FULL defaults
    if (row.default_application_ids === null) {
      accessibleAppIds = fullDefIds;
      accessibleAppCodes = fullDefCodes;
      // Limits = 0
      limitAppCount = 0;
    } else {
      // Calculate Limits: Full Defaults - Active Defaults
      const activeIds = accessibleAppIds.map(Number);
      const limitIds = fullDefIds.filter((id) => !activeIds.includes(id));

      if (limitIds.length > 0) {
        limitAppCount = limitIds.length;
        limitAppIdsStr = limitIds.sort((a, b) => a - b).join(",");
        // Get codes for limitIds
        const [lApps] = await pool.query(
          "SELECT code FROM applications WHERE id IN (?)",
          [limitIds],
        );
        limitAppCodesStr = lApps
          .map((a) => a.code)
          .sort()
          .join(",");
      }
    }
  }

  // 2. Add Extras
  if (row.extra_application_ids) {
    const extraIds = row.extra_application_ids.split(",").map(Number);
    const extraCodes = row.extra_application_codes
      ? row.extra_application_codes.split(",")
      : [];
    accessibleAppIds = [...new Set([...accessibleAppIds, ...extraIds])];
    accessibleAppCodes = [...new Set([...accessibleAppCodes, ...extraCodes])];
  }

  // Sort and join for storage
  const finalAccessibleAppIds =
    accessibleAppIds.sort((a, b) => a - b).join(",") || null;
  const finalAccessibleAppCodes = accessibleAppCodes.sort().join(",") || null;
  const finalAccessibleAppCount = accessibleAppIds.length;

  // We also need to update limit columns if row exists
  // Currently sync assumes row might not exist?
  // If row doesn't exist, we can't update up.* columns easily unless we INSERT?
  // But we only sync if user has privileges usually?
  // Wait, I said earlier "syncUserAccessibleApps will only work for privileged users".
  // But I removed the check?
  // Logic: "UPDATE user_privileges ... WHERE user_id = ?"
  // If no row, it updates nothing.

  await pool.query(
    `UPDATE user_privileges 
     SET accessible_app_count = ?, accessible_app_codes = ?,
         limit_app_count = ?, limit_application_ids = ?, limit_application_codes = ?
     WHERE user_id = ?`,
    [
      finalAccessibleAppCount,
      finalAccessibleAppCodes,
      limitAppCount,
      limitAppIdsStr,
      limitAppCodesStr,
      userId,
    ],
  );
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      position,
      department,
      role,
      status,
      has_privilege,
      password,
    } = req.body;
    const avatar = req.file ? `/uploads/icons/${req.file.filename}` : undefined;

    // Build SET clauses dynamically to avoid trailing comma issues
    const setClauses = [];
    const params = [];

    if (name !== undefined) {
      setClauses.push("name = ?");
      params.push(name);
    }
    if (email !== undefined) {
      setClauses.push("email = ?");
      params.push(email);
    }
    if (position !== undefined) {
      setClauses.push("position = ?");
      params.push(position);
    }
    if (department !== undefined) {
      setClauses.push("department = ?");
      params.push(department);
    }
    if (role !== undefined) {
      setClauses.push("role = ?");
      params.push(role);
    }
    if (status !== undefined) {
      setClauses.push("status = ?");
      params.push(status);
    }
    if (has_privilege !== undefined) {
      setClauses.push("has_privilege = ?");
      params.push(has_privilege);
    }
    if (avatar !== undefined) {
      setClauses.push("avatar = ?");
      params.push(avatar);
    }

    // Hash password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      setClauses.push("password = ?");
      params.push(hashedPassword);
    }

    setClauses.push("updated_at = CURRENT_TIMESTAMP");

    if (setClauses.length === 1) {
      // Only updated_at, nothing to update
      return res
        .status(400)
        .json({ success: false, message: "No fields to update" });
    }

    const query = `UPDATE users SET ${setClauses.join(", ")} WHERE id = ?`;
    params.push(id);

    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Auto-sync user_privileges when has_privilege is toggled
    if (has_privilege !== undefined) {
      const privEnabled =
        has_privilege === 1 || has_privilege === "1" || has_privilege === true;

      if (privEnabled) {
        // Fetch department default apps
        const [deptRows] = await pool.query(
          "SELECT allowed_apps FROM departments WHERE name = ?",
          [department],
        );
        let defIdsStr = null;
        let defCodesStr = null;

        if (deptRows.length > 0 && deptRows[0].allowed_apps) {
          const rawApps = deptRows[0].allowed_apps;
          let parsedApps = [];
          try {
            parsedApps = JSON.parse(rawApps);
          } catch (e) {
            parsedApps = rawApps.split(",").map((c) => c.trim());
          }

          if (Array.isArray(parsedApps) && parsedApps.length > 0) {
            const isIds = parsedApps.every((item) => !isNaN(Number(item)));
            if (isIds) {
              const defIds = parsedApps.map(Number);
              const [apps] = await pool.query(
                "SELECT code FROM applications WHERE id IN (?)",
                [defIds],
              );
              defIdsStr = defIds.sort((a, b) => a - b).join(",");
              defCodesStr = apps
                .map((a) => a.code)
                .sort()
                .join(",");
            } else {
              const [apps] = await pool.query(
                "SELECT id, code FROM applications WHERE code IN (?)",
                [parsedApps],
              );
              defIdsStr = apps
                .map((a) => a.id)
                .sort((a, b) => a - b)
                .join(",");
              defCodesStr = apps
                .map((a) => a.code)
                .sort()
                .join(",");
            }
          }
        }

        // Create user_privileges row with defaults, but NO EXTRA apps (extra_* = NULL)
        await pool.query(
          `
          INSERT INTO user_privileges (
            user_id, 
            extra_application_ids, extra_application_codes, extra_app_count,
            default_application_ids, default_application_codes
          ) VALUES (?, NULL, NULL, 0, ?, ?)
          ON DUPLICATE KEY UPDATE 
            default_application_ids = VALUES(default_application_ids),
            default_application_codes = VALUES(default_application_codes)
        `,
          [id, defIdsStr, defCodesStr],
        );
      } else {
        // Remove privilege row when toggled OFF
        await pool.query("DELETE FROM user_privileges WHERE user_id = ?", [id]);
      }
    }

    // Sync accessible_app_count and accessible_app_codes
    await syncUserAccessibleApps(id);

    // Log admin action
    if (req.body.admin_id) {
      await logAudit({
        admin_id: req.body.admin_id,
        action_type: "UPDATE",
        target_type: "USER",
        target_id: id,
        details: `Updated user profile/role for ${name || id}. Fields: ${setClauses.filter((c) => !c.includes("updated_at")).join(", ")}`,
        ip_address: req.ip,
      });
    }

    res.json({ success: true, message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user",
      error: error.message,
    });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query("DELETE FROM users WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message,
    });
  }
};

// Get user privileges (extra apps di luar default department)
export const getUserPrivileges = async (req, res) => {
  try {
    const { id } = req.params;

    // Get user dept and privileges in one go
    const [rows] = await pool.query(
      `
      SELECT u.department, up.default_application_ids, up.extra_application_ids
      FROM users u
      LEFT JOIN user_privileges up ON u.id = up.user_id
      WHERE u.id = ?
    `,
      [id],
    );

    if (rows.length === 0) {
      // User not found, return empty
      return res.json({ success: true, data: [] });
    }

    const row = rows[0];
    let appIds = [];

    // 1. Resolve Defaults
    // If default_application_ids is NOT NULL, use it (empty string means "None", populated means "Some")
    // If it IS NULL (Legacy or No Row), use All Department Defaults
    if (row.default_application_ids !== null) {
      appIds = row.default_application_ids
        ? row.default_application_ids.split(",").map(Number)
        : [];
    } else {
      // Fetch Dept Defaults
      // Fetch Dept Defaults
      const [deptRows] = await pool.query(
        "SELECT allowed_apps FROM departments WHERE name = ?",
        [row.department],
      );
      if (deptRows.length > 0 && deptRows[0].allowed_apps) {
        const rawApps = deptRows[0].allowed_apps;
        let parsedApps = [];

        // Try JSON first (likely [1,2])
        try {
          parsedApps = JSON.parse(rawApps);
        } catch (e) {
          parsedApps = rawApps.split(",").map((c) => c.trim());
        }

        if (Array.isArray(parsedApps) && parsedApps.length > 0) {
          // Check if mostly numbers (IDs)
          const isIds = parsedApps.every((item) => !isNaN(Number(item)));

          if (isIds) {
            // Direct IDs
            appIds = parsedApps.map(Number);
          } else {
            // Codes
            const [apps] = await pool.query(
              "SELECT id FROM applications WHERE code IN (?)",
              [parsedApps],
            );
            appIds = apps.map((a) => a.id);
          }
        }
      }
    }

    // 2. Add Extras
    if (row.extra_application_ids) {
      const extras = row.extra_application_ids.split(",").map(Number);
      appIds = [...new Set([...appIds, ...extras])];
    }

    res.json({
      success: true,
      data: appIds.map((appId) => ({ application_id: appId })),
    });
  } catch (error) {
    console.error("Error fetching user privileges:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user privileges",
      error: error.message,
    });
  }
};

// Update user privileges (extra apps di luar default department)
export const updateUserPrivileges = async (req, res) => {
  try {
    const { id } = req.params;
    const { application_ids, has_privilege } = req.body;

    // Update has_privilege flag on users table
    await pool.query("UPDATE users SET has_privilege = ? WHERE id = ?", [
      has_privilege || false,
      id,
    ]);

    // Fetch department defaults for this user
    const [userRows] = await pool.query(
      "SELECT department FROM users WHERE id = ?",
      [id],
    );
    if (userRows.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const departmentName = userRows[0].department;

    // Get department default apps
    const [deptRows] = await pool.query(
      "SELECT allowed_apps FROM departments WHERE name = ?",
      [departmentName],
    );
    let defIds = [];
    let defCodes = [];

    if (deptRows.length > 0 && deptRows[0].allowed_apps) {
      const rawApps = deptRows[0].allowed_apps;
      let parsedApps = [];
      try {
        parsedApps = JSON.parse(rawApps);
      } catch (e) {
        parsedApps = rawApps.split(",").map((c) => c.trim());
      }

      if (Array.isArray(parsedApps) && parsedApps.length > 0) {
        const isIds = parsedApps.every((item) => !isNaN(Number(item)));

        if (isIds) {
          // IDs
          defIds = parsedApps.map(Number);
          const [apps] = await pool.query(
            "SELECT code FROM applications WHERE id IN (?)",
            [defIds],
          );
          defCodes = apps.map((a) => a.code);
        } else {
          // Codes
          const [apps] = await pool.query(
            "SELECT id, code FROM applications WHERE code IN (?)",
            [parsedApps],
          );
          defIds = apps.map((a) => a.id).sort((a, b) => a - b);
          defCodes = apps.map((a) => a.code).sort();
        }
      }
    }

    const defIdsStr = defIds.join(",") || null;
    const defCodesStr = defCodes.join(",") || null;

    let logExtraCount = 0;
    let logLimitCount = 0;

    if (has_privilege) {
      // 1. Calculate Extras
      const submittedIds = Array.isArray(application_ids)
        ? application_ids.map(Number)
        : application_ids
          ? application_ids.split(",").map(Number)
          : [];

      // 2. Identify Enabled Defaults vs Extras vs Limits
      const enabledDefIds = submittedIds.filter((id) => defIds.includes(id));
      const extraIds = submittedIds.filter((id) => !defIds.includes(id));
      const limitIds = defIds.filter((id) => !enabledDefIds.includes(id));

      // Get codes
      let enabledDefCodes = [];
      if (enabledDefIds.length > 0) {
        const [apps] = await pool.query(
          "SELECT code FROM applications WHERE id IN (?) ORDER BY code",
          [enabledDefIds],
        );
        enabledDefCodes = apps.map((a) => a.code);
      }

      let extraCodes = [];
      if (extraIds.length > 0) {
        const [apps] = await pool.query(
          "SELECT code FROM applications WHERE id IN (?) ORDER BY code",
          [extraIds],
        );
        extraCodes = apps.map((a) => a.code);
      }

      let limitCodes = [];
      if (limitIds.length > 0) {
        const [apps] = await pool.query(
          "SELECT code FROM applications WHERE id IN (?) ORDER BY code",
          [limitIds],
        );
        limitCodes = apps.map((a) => a.code);
      }

      // Format strings (Default used ('') in original but better to use (',') if DB is TEXT?
      // Original code used ('') which is weird if IDs are > 9? 11,12 -> 1112?
      // Wait. `join('')`??
      // If IDs are [1, 2], join('') is "12".
      // If IDs are [10, 11], join('') is "1011".
      // This seems like a BUG in original code!
      // But I am rewriting it now. I will use `join(',')`.
      // Legacy data might be broken if I don't fix it?
      // I'll use `join(',')` which is safe.

      const enabledDefIdsStr =
        enabledDefIds.sort((a, b) => a - b).join(",") || null;
      const enabledDefCodesStr = enabledDefCodes.sort().join(",") || null;

      const extraIdsStr = extraIds.sort((a, b) => a - b).join(",") || null;
      const extraCodesStr = extraCodes.sort().join(",") || null;
      const extraCount = extraIds.length;

      const limitIdsStr = limitIds.sort((a, b) => a - b).join(",") || null;
      const limitCodesStr = limitCodes.sort().join(",") || null;
      const limitCount = limitIds.length;

      logExtraCount = extraCount;
      logLimitCount = limitCount;

      // Accessible Count
      const accessibleAppIds = [...enabledDefIds, ...extraIds];
      const accessibleAppCodes = [...enabledDefCodes, ...extraCodes];
      const accessibleAppCount = accessibleAppIds.length;
      const accessibleAppCodesStr = accessibleAppCodes.sort().join(",") || null;

      // Upsert
      await pool.query(
        `
        INSERT INTO user_privileges (
          user_id, 
          extra_application_ids, extra_application_codes, extra_app_count, 
          default_application_ids, default_application_codes,
          limit_application_ids, limit_application_codes, limit_app_count,
          accessible_app_count, accessible_app_codes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          extra_application_ids = VALUES(extra_application_ids),
          extra_application_codes = VALUES(extra_application_codes),
          extra_app_count = VALUES(extra_app_count),
          default_application_ids = VALUES(default_application_ids),
          default_application_codes = VALUES(default_application_codes),
          limit_application_ids = VALUES(limit_application_ids),
          limit_application_codes = VALUES(limit_application_codes),
          limit_app_count = VALUES(limit_app_count),
          accessible_app_count = VALUES(accessible_app_count),
          accessible_app_codes = VALUES(accessible_app_codes),
          updated_at = CURRENT_TIMESTAMP
      `,
        [
          id,
          extraIdsStr,
          extraCodesStr,
          extraCount,
          enabledDefIdsStr,
          enabledDefCodesStr,
          limitIdsStr,
          limitCodesStr,
          limitCount,
          accessibleAppCount,
          accessibleAppCodesStr,
        ],
      );
    } else {
      // No privileges — remove the row (or keep it with nulls? Current logic removes it)
      await pool.query("DELETE FROM user_privileges WHERE user_id = ?", [id]);
    }

    // Sync accessible_app_count and accessible_app_codes
    await syncUserAccessibleApps(id);

    // Log admin action
    if (req.body.admin_id) {
      await logAudit({
        admin_id: req.body.admin_id,
        action_type: "UPDATE",
        target_type: "PRIVILEGE",
        target_id: id,
        details: `Updated privileges for user ${id}. Privilege Status: ${has_privilege ? "Enabled" : "Disabled"}, Extra Apps: ${logExtraCount}, Limit Apps: ${logLimitCount}`,
        ip_address: req.ip,
      });
    }

    res.json({
      success: true,
      message: "User privileges updated successfully",
    });
  } catch (error) {
    console.error("Error updating user privileges:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user privileges",
      error: error.message,
    });
  }
};

// Login user - verify email and password
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const [rows] = await pool.query(
      'SELECT id, name, email, password, avatar, position, department, role, status FROM users WHERE email = ? AND status = "active"',
      [email],
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or account is inactive",
      });
    }

    const user = rows[0];

    // If user has a password set, verify it
    if (user.password) {
      if (!password) {
        return res
          .status(400)
          .json({ success: false, message: "Password is required" });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid password" });
      }
    } else {
      // User has no password set — block login and prompt to set one
      return res
        .status(403)
        .json({
          success: false,
          message: "Password not set. Please contact your administrator.",
        });
    }

    // Log login activity (non-critical, don't fail login if this fails)
    try {
      await logActivity({
        user_id: user.id,
        activity_type: "LOGIN",
        details: `User logged in from ${req.ip || "unknown"}`,
      });
    } catch (logError) {
      console.error("Failed to log activity (non-critical):", logError.message);
    }

    // Remove password from response
    const { password: _, ...userData } = user;

    res.json({
      success: true,
      found: true,
      data: userData,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ success: false, message: "Login failed" });
  }
};

// Change user password
export const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters",
      });
    }

    // Get user's current password hash and last change timestamp
    const [rows] = await pool.query(
      "SELECT id, password, password_changed_at FROM users WHERE id = ?",
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = rows[0];

    // Check if password was changed within the last 30 days
    if (user.password_changed_at) {
      const lastChanged = new Date(user.password_changed_at);
      const now = new Date();
      const diffDays = Math.floor((now - lastChanged) / (1000 * 60 * 60 * 24));
      if (diffDays < 30) {
        const remainingDays = 30 - diffDays;
        return res.status(429).json({
          success: false,
          message: `Password can only be changed once per month. Please wait ${remainingDays} more day(s).`,
        });
      }
    }

    // Verify current password
    if (user.password) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect",
        });
      }
    }

    // Hash new password and update
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query(
      "UPDATE users SET password = ?, password_changed_at = NOW() WHERE id = ?",
      [hashedPassword, id],
    );

    // Log activity
    try {
      await logActivity({
        user_id: id,
        activity_type: "PASSWORD_CHANGE",
        details: "User changed their password",
      });
    } catch (logError) {
      console.error("Failed to log activity (non-critical):", logError.message);
    }

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};

// Sync all users metrics (Temporary/Admin tool)
export const syncAllUsers = async (req, res) => {
  try {
    const [users] = await pool.query("SELECT id FROM users");
    let count = 0;
    for (const user of users) {
      await syncUserAccessibleApps(user.id);
      count++;
    }
    res.json({ success: true, message: `Synced ${count} users successfully` });
  } catch (error) {
    console.error("Error syncing all users:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
