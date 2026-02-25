import db from "../config/database.js";

// GET all menus
export const getAllMenus = async (req, res) => {
  try {
    const [menus] = await db.query(
      "SELECT * FROM menus ORDER BY display_order ASC, id ASC",
    );

    const result = menus.map((m) => ({
      id: m.id,
      label: m.label,
      path: m.path,
      icon: m.icon,
      customIcon: m.custom_icon || null,
      order: m.display_order,
      isActive: m.is_active === 1,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching menus:", error);
    res.status(500).json({ success: false, message: "Failed to fetch menus" });
  }
};

// CREATE menu
export const createMenu = async (req, res) => {
  try {
    const { label, path, icon, customIcon, order, isActive } = req.body;
    if (!label || !path) {
      return res
        .status(400)
        .json({ success: false, message: "Label and path are required" });
    }

    const [result] = await db.query(
      "INSERT INTO menus (label, path, icon, custom_icon, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?)",
      [
        label,
        path,
        icon || "fas fa-th-large",
        customIcon || null,
        order || 0,
        isActive !== false ? 1 : 0,
      ],
    );

    res.status(201).json({
      success: true,
      message: "Menu created",
      data: { id: result.insertId },
    });
  } catch (error) {
    console.error("Error creating menu:", error);
    res.status(500).json({ success: false, message: "Failed to create menu" });
  }
};

// UPDATE menu
export const updateMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, path, icon, customIcon, order, isActive } = req.body;

    await db.query(
      "UPDATE menus SET label = ?, path = ?, icon = ?, custom_icon = ?, display_order = ?, is_active = ? WHERE id = ?",
      [
        label,
        path,
        icon || "fas fa-th-large",
        customIcon || null,
        order || 0,
        isActive !== false ? 1 : 0,
        id,
      ],
    );

    res.json({ success: true, message: "Menu updated" });
  } catch (error) {
    console.error("Error updating menu:", error);
    res.status(500).json({ success: false, message: "Failed to update menu" });
  }
};

// DELETE menu
export const deleteMenu = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM menus WHERE id = ?", [id]);
    res.json({ success: true, message: "Menu deleted" });
  } catch (error) {
    console.error("Error deleting menu:", error);
    res.status(500).json({ success: false, message: "Failed to delete menu" });
  }
};

// TOGGLE menu status
export const toggleMenuStatus = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(
      "UPDATE menus SET is_active = NOT is_active WHERE id = ?",
      [id],
    );
    res.json({ success: true, message: "Menu status toggled" });
  } catch (error) {
    console.error("Error toggling menu:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to toggle menu status" });
  }
};
