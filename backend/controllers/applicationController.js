import db from "../config/database.js";

// Get all applications
export const getApplications = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        id,
        name,
        code,
        description,
        icon,
        url,
        status,
        created_at
      FROM applications 
      ORDER BY name ASC
    `);

    res.json({
      success: true,
      data: rows,
      message: "Applications retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting applications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve applications",
      error: error.message,
    });
  }
};

// Get applications by category/department
export const getApplicationsByCategory = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        id,
        name,
        code,
        description,
        icon,
        url,
        status,
        created_at
      FROM applications 
      ORDER BY name ASC
    `);

    // Group all applications under 'All' since categories are dynamic
    const groupedApplications = { All: rows };

    res.json({
      success: true,
      data: groupedApplications,
      message: "Applications categorized successfully",
    });
  } catch (error) {
    console.error("Error getting categorized applications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve categorized applications",
      error: error.message,
    });
  }
};

// Get single application by ID
export const getApplicationById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.execute(
      "SELECT id, name, code, description, icon, url, status, created_at FROM applications WHERE id = ?",
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    res.json({
      success: true,
      data: rows[0],
      message: "Application retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting application:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve application",
      error: error.message,
    });
  }
};

// Get application by code
export const getApplicationByCode = async (req, res) => {
  const { code } = req.params;

  try {
    const [rows] = await db.execute(
      "SELECT id, name, code, description, icon, url, status, created_at FROM applications WHERE code = ?",
      [code.toUpperCase()],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    res.json({
      success: true,
      data: rows[0],
      message: "Application retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting application:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve application",
      error: error.message,
    });
  }
};

// Create new application
export const createApplication = async (req, res) => {
  const { name, code, description, url, status } = req.body;
  const icon = req.file ? `/uploads/icons/${req.file.filename}` : null;

  if (!name || !code) {
    return res.status(400).json({
      success: false,
      message: "Name and Code are required",
    });
  }

  try {
    const [result] = await db.execute(
      "INSERT INTO applications (name, code, description, icon, url, status) VALUES (?, ?, ?, ?, ?, ?)",
      [
        name,
        code.toUpperCase(),
        description || null,
        icon,
        url || null,
        status || "active",
      ],
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        name,
        code,
        description,
        icon,
        url,
        status: status || "active",
      },
      message: "Application created successfully",
    });
  } catch (error) {
    console.error("Error creating application:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create application",
      error: error.message,
    });
  }
};

// Update application
export const updateApplication = async (req, res) => {
  const { id } = req.params;
  const { name, code, description, url, status } = req.body;

  // If a new file is uploaded, use it. Otherwise keep existing.
  // We need to handle this carefully.
  // If req.file exists, we update icon. If not, we don't (unless explicitly cleared, but that's complex).

  try {
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name);
    }
    if (code !== undefined) {
      updates.push("code = ?");
      values.push(code.toUpperCase());
    }
    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description);
    }
    if (url !== undefined) {
      updates.push("url = ?");
      values.push(url);
    }
    if (status !== undefined) {
      updates.push("status = ?");
      values.push(status);
    }

    if (req.file) {
      updates.push("icon = ?");
      values.push(`/uploads/icons/${req.file.filename}`);
    }

    if (updates.length === 0) {
      return res.json({ success: true, message: "No changes provided" });
    }

    values.push(id);

    await db.execute(
      `UPDATE applications SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    res.json({
      success: true,
      message: "Application updated successfully",
    });
  } catch (error) {
    console.error("Error updating application:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update application",
      error: error.message,
    });
  }
};

// Delete application
export const deleteApplication = async (req, res) => {
  const { id } = req.params;

  try {
    await db.execute("DELETE FROM applications WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting application:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete application",
      error: error.message,
    });
  }
};
