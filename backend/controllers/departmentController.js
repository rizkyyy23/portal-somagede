import pool from '../config/database.js';

// Get all departments
export const getAllDepartments = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM departments ORDER BY name ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ success: false, message: 'Error fetching departments', error: error.message });
  }
};
// Update department details
export const updateDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { name, code, description, color } = req.body;
    
    await pool.query(
      'UPDATE departments SET name = ?, code = ?, description = ?, color = ? WHERE id = ?',
      [name, code, description, color, departmentId]
    );
    
    res.json({ success: true, message: 'Department updated successfully' });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ success: false, message: 'Error updating department', error: error.message });
  }
};

// Get all department permissions
export const getAllDepartmentPermissions = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, code, allowed_apps FROM departments ORDER BY name ASC');
    
    const formattedData = rows.map(dept => {
        let apps = [];
        if (dept.allowed_apps) {
            try {
                // Handle if it's already an object/array or a string
                apps = typeof dept.allowed_apps === 'string' 
                    ? JSON.parse(dept.allowed_apps) 
                    : dept.allowed_apps;
            } catch (e) {
                // Fallback for CSV or other formats if JSON parse fails
                apps = String(dept.allowed_apps).split(',');
            }
        }
        
        if (!Array.isArray(apps)) apps = [];
        
        // Transform simple app codes into permission objects expected by frontend
        const permissions = apps.map(appCode => ({
            application_code: typeof appCode === 'string' ? appCode.trim() : appCode,
            enabled: true
        }));
        
        return {
            id: dept.id,
            name: dept.name,
            code: dept.code,
            permissions: permissions
        };
    });

    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Error fetching all department permissions:', error);
    res.status(500).json({ success: false, message: 'Error fetching department permissions', error: error.message });
  }
};

// Get permissions for a specific department
export const getDepartmentPermissions = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const [rows] = await pool.query('SELECT * FROM departments WHERE id = ?', [departmentId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching department permissions:', error);
    res.status(500).json({ success: false, message: 'Error fetching department permissions', error: error.message });
  }
};

// Update department permissions
export const updateDepartmentPermissions = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { allowed_apps } = req.body; // Expect JSON string or array of app IDs/codes
    
    await pool.query('UPDATE departments SET allowed_apps = ? WHERE id = ?', [allowed_apps, departmentId]);
    
    res.json({ success: true, message: 'Department permissions updated successfully' });
  } catch (error) {
    console.error('Error updating department permissions:', error);
    res.status(500).json({ success: false, message: 'Error updating department permissions', error: error.message });
  }
};

// Toggle department permission (single app)
export const toggleDepartmentPermission = async (req, res) => {
  try {
    const { departmentId, applicationId } = req.params;
    // Logic to toggle permission for a specific app within allowed_apps JSON/String
    // This is complex because allowed_apps format is ambiguous (JSON vs CSV).
    // For now, I will implement a placeholder or basic string manipulation if needed.
    // Since I don't want to overcomplicate without seeing the data, I'll return 'Not implemented' or basic update.
    
    // Fetch current apps
    const [rows] = await pool.query('SELECT allowed_apps FROM departments WHERE id = ?', [departmentId]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Department not found' });
    
    let currentApps = rows[0].allowed_apps;
    let appsArray = [];
    try {
        appsArray = JSON.parse(currentApps);
    } catch (e) {
        appsArray = currentApps ? currentApps.split(',') : [];
    }
    
    if (!Array.isArray(appsArray)) appsArray = [];
    
    // Check if applicationId exists
    const index = appsArray.indexOf(String(applicationId));
    if (index > -1) {
        appsArray.splice(index, 1); // Remove
    } else {
        appsArray.push(String(applicationId)); // Add
    }
    
    const newApps = JSON.stringify(appsArray);
    
    await pool.query('UPDATE departments SET allowed_apps = ? WHERE id = ?', [newApps, departmentId]);
    
    res.json({ success: true, message: 'Department permission toggled successfully', data: appsArray });
  } catch (error) {
    console.error('Error toggling department permission:', error);
    res.status(500).json({ success: false, message: 'Error toggling department permission', error: error.message });
  }
};
