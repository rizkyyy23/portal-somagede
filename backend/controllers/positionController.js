import db from "../config/database.js";

// GET all positions
export const getAllPositions = async (req, res) => {
  try {
    const [positions] = await db.query(
      "SELECT * FROM positions ORDER BY name ASC",
    );

    const parsed = positions.map((p) => ({
      ...p,
      isActive: p.status === "active",
    }));

    // Count users per position
    const [users] = await db.query(
      'SELECT position, COUNT(*) as count FROM users WHERE status = "active" GROUP BY position',
    );
    const userCountMap = {};
    users.forEach((u) => {
      userCountMap[u.position] = u.count;
    });

    const result = parsed.map((p) => ({
      ...p,
      userCount: userCountMap[p.name] || 0,
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching positions:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch positions" });
  }
};

// CREATE position
export const createPosition = async (req, res) => {
  try {
    const { name, code, description, isActive } = req.body;
    if (!name || !code) {
      return res
        .status(400)
        .json({ success: false, message: "Name and code are required" });
    }

    const [result] = await db.query(
      "INSERT INTO positions (name, code, description, status) VALUES (?, ?, ?, ?)",
      [
        name,
        code.toUpperCase(),
        description || "",
        isActive !== false ? "active" : "inactive",
      ],
    );

    res
      .status(201)
      .json({
        success: true,
        message: "Position created successfully",
        data: { id: result.insertId },
      });
  } catch (error) {
    console.error("Error creating position:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Position name or code already exists",
        });
    }
    res
      .status(500)
      .json({ success: false, message: "Failed to create position" });
  }
};

// UPDATE position
export const updatePosition = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, isActive } = req.body;

    if (!name || !code) {
      return res
        .status(400)
        .json({ success: false, message: "Name and code are required" });
    }

    await db.query(
      "UPDATE positions SET name = ?, code = ?, description = ?, status = ? WHERE id = ?",
      [
        name,
        code.toUpperCase(),
        description || "",
        isActive !== false ? "active" : "inactive",
        id,
      ],
    );

    res.json({ success: true, message: "Position updated successfully" });
  } catch (error) {
    console.error("Error updating position:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Position name or code already exists",
        });
    }
    res
      .status(500)
      .json({ success: false, message: "Failed to update position" });
  }
};

// DELETE position
export const deletePosition = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if any users are assigned to this position
    const [users] = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE position = (SELECT name FROM positions WHERE id = ?)",
      [id],
    );
    if (users[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete position because ${users[0].count} users are assigned to it`,
      });
    }

    await db.query("DELETE FROM positions WHERE id = ?", [id]);
    res.json({ success: true, message: "Position deleted successfully" });
  } catch (error) {
    console.error("Error deleting position:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete position" });
  }
};

// TOGGLE position status
export const togglePositionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(
      'UPDATE positions SET status = IF(status = "active", "inactive", "active") WHERE id = ?',
      [id],
    );
    res.json({
      success: true,
      message: "Position status toggled successfully",
    });
  } catch (error) {
    console.error("Error toggling position status:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to toggle status" });
  }
};
