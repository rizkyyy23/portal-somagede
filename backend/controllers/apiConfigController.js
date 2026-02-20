import pool from "../config/database.js";

// GET all configurations
export const getAllConfigs = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM api_configurations ORDER BY id ASC",
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error fetching API configs:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch API configurations" });
  }
};

// CREATE new configuration
export const createConfig = async (req, res) => {
  try {
    const {
      name,
      endpoint,
      api_key,
      description,
      method,
      timeout,
      retry_attempts,
      status,
    } = req.body;

    if (!name || !endpoint || !api_key) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Name, Endpoint, and API Key are required",
        });
    }

    const [result] = await pool.query(
      `INSERT INTO api_configurations (name, endpoint, api_key, description, method, timeout, retry_attempts, status, last_sync) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        name,
        endpoint,
        api_key,
        description,
        method || "GET",
        timeout || 30000,
        retry_attempts || 3,
        status || "active",
      ],
    );

    res
      .status(201)
      .json({ success: true, data: { id: result.insertId, ...req.body } });
  } catch (error) {
    console.error("Error creating API config:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create configuration" });
  }
};

// UPDATE configuration
export const updateConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      endpoint,
      api_key,
      description,
      method,
      timeout,
      retry_attempts,
      status,
    } = req.body;

    await pool.query(
      `UPDATE api_configurations 
       SET name=?, endpoint=?, api_key=?, description=?, method=?, timeout=?, retry_attempts=?, status=?
       WHERE id=?`,
      [
        name,
        endpoint,
        api_key,
        description,
        method,
        timeout,
        retry_attempts,
        status,
        id,
      ],
    );

    res.json({ success: true, message: "Configuration updated successfully" });
  } catch (error) {
    console.error("Error updating API config:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update configuration" });
  }
};

// DELETE configuration
export const deleteConfig = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM api_configurations WHERE id = ?", [id]);
    res.json({ success: true, message: "Configuration deleted successfully" });
  } catch (error) {
    console.error("Error deleting API config:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete configuration" });
  }
};

// TEST connection
export const testConnection = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      "SELECT * FROM api_configurations WHERE id = ?",
      [id],
    );

    if (rows.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Config not found" });

    const config = rows[0];

    // Attempt actual connection test
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        config.timeout || 10000,
      );
      const response = await fetch(config.endpoint, {
        method: config.method || "GET",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const latency = Date.now() - startTime;

      // Update last_sync timestamp
      await pool.query(
        "UPDATE api_configurations SET last_sync = NOW() WHERE id = ?",
        [id],
      );

      res.json({
        success: true,
        message: `Successfully connected to ${config.name}`,
        details: {
          status: response.status,
          latency: `${latency}ms`,
          method: config.method,
        },
      });
    } catch (fetchError) {
      const latency = Date.now() - startTime;
      res.json({
        success: false,
        message: `Failed to connect to ${config.name}: ${fetchError.message}`,
        details: {
          status: 0,
          latency: `${latency}ms`,
          method: config.method,
          error: fetchError.message,
        },
      });
    }
  } catch (error) {
    console.error("Error testing connection:", error);
    res.status(500).json({ success: false, message: "Connection test failed" });
  }
};
