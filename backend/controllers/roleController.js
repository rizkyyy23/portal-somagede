import db from "../config/database.js";

// GET all roles
export const getAllRoles = async (req, res) => {
  try {
    const [roles] = await db.query("SELECT * FROM roles ORDER BY id ASC");

    // Parse permissions from JSON string
    const parsed = roles.map((r) => {
      let permissions = [];
      try {
        permissions = r.permissions ? JSON.parse(r.permissions) : [];
      } catch (e) {
        console.error(
          `Invalid JSON in permissions for role ${r.id}:`,
          e.message,
        );
      }
      return {
        ...r,
        permissions,
        isActive: r.is_active === 1,
      };
    });

    // Count users per role (all users regardless of status)
    const [users] = await db.query(
      "SELECT role, COUNT(*) as count FROM users GROUP BY role",
    );
    const userCountMap = {};
    users.forEach((u) => {
      userCountMap[u.role] = u.count;
    });

    const result = parsed.map((r) => ({
      ...r,
      userCount: userCountMap[r.name] || 0,
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ success: false, message: "Failed to fetch roles" });
  }
};

// CREATE role
export const createRole = async (req, res) => {
  try {
    const { name, code, description, permissions, isActive } = req.body;
    if (!name || !code) {
      return res
        .status(400)
        .json({ success: false, message: "Name and code are required" });
    }

    const permStr = JSON.stringify(permissions || []);
    const [result] = await db.query(
      "INSERT INTO roles (name, code, description, permissions, is_active) VALUES (?, ?, ?, ?, ?)",
      [name, code, description || "", permStr, isActive !== false ? 1 : 0],
    );

    res.status(201).json({
      success: true,
      message: "Role created",
      data: { id: result.insertId },
    });
  } catch (error) {
    console.error("Error creating role:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ success: false, message: "Role name or code already exists" });
    }
    res.status(500).json({ success: false, message: "Failed to create role" });
  }
};

// UPDATE role
export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, permissions, isActive } = req.body;

    const permStr = JSON.stringify(permissions || []);
    await db.query(
      "UPDATE roles SET name = ?, code = ?, description = ?, permissions = ?, is_active = ? WHERE id = ?",
      [name, code, description || "", permStr, isActive !== false ? 1 : 0, id],
    );

    res.json({ success: true, message: "Role updated" });
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({ success: false, message: "Failed to update role" });
  }
};

// DELETE role
export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting system roles
    const [role] = await db.query("SELECT code FROM roles WHERE id = ?", [id]);
    if (
      role.length > 0 &&
      (role[0].code === "ADMIN" || role[0].code === "USER")
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot delete system roles" });
    }

    await db.query("DELETE FROM roles WHERE id = ?", [id]);
    res.json({ success: true, message: "Role deleted" });
  } catch (error) {
    console.error("Error deleting role:", error);
    res.status(500).json({ success: false, message: "Failed to delete role" });
  }
};

// TOGGLE role status
export const toggleRoleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("UPDATE roles SET is_active = NOT is_active WHERE id = ?", [
      id,
    ]);
    res.json({ success: true, message: "Role status toggled" });
  } catch (error) {
    console.error("Error toggling role:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to toggle role status" });
  }
};
