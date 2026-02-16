import db from '../config/database.js';

// Get all audit logs
export const getAuditLogs = async (req, res) => {
  try {
    const [logs] = await db.query(`
      SELECT al.*, u.name as admin_name 
      FROM audit_logs al
      JOIN users u ON al.admin_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 200
    `);
    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
};

// Get User Distribution by Department
export const getDeptDistribution = async (req, res) => {
  try {
    const [data] = await db.query(`
      SELECT department, COUNT(*) as count 
      FROM users 
      GROUP BY department
    `);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching distribution:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch distribution' });
  }
};

// Get Login Trends (Current Week: Mon-Sun)
export const getLoginTrends = async (req, res) => {
  try {
    // Fetch data from current week starting Monday
    const [data] = await db.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM user_activities
      WHERE activity_type = 'LOGIN'
      AND created_at >= DATE_SUB(CURDATE(), INTERVAL (WEEKDAY(CURDATE())) DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Map to fixed 7 days (Mon-Sun) in Indonesian
    const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    
    // Get this week's Monday
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const trends = dayNames.map((day, index) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + index);
      // Correct for timezone to ensure we compare local dates correctly
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dateVal = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${dateVal}`;
      
      const found = data.find(item => {
        // SQL result date formatting
        const itemDate = new Date(item.date);
        const iy = itemDate.getFullYear();
        const im = String(itemDate.getMonth() + 1).padStart(2, '0');
        const id = String(itemDate.getDate()).padStart(2, '0');
        const itemDateStr = `${iy}-${im}-${id}`;
        return itemDateStr === dateStr;
      });

      return {
        date: dateStr,
        day: day,
        count: found ? found.count : 0
      };
    });

    res.json({ success: true, data: trends });
  } catch (error) {
    console.error('Error fetching login trends:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch login trends' });
  }
};

// Get Most Used Apps based on activity tracking
export const getAppUsage = async (req, res) => {
  try {
    // Extract app names from "Accessed [AppName]" strings in details
    const [data] = await db.query(`
      SELECT 
        REPLACE(details, 'Accessed ', '') as name,
        COUNT(*) as value
      FROM user_activities
      WHERE activity_type = 'APP_ACCESS'
      GROUP BY name
      ORDER BY value DESC
      LIMIT 5
    `);

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching app usage:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch app usage' });
  }
};
