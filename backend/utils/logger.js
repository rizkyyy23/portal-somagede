import db from '../config/database.js';

/**
 * Log an administrative action to the audit_logs table.
 */
export const logAudit = async ({ admin_id, action_type, target_type, target_id, details, ip_address }) => {
  try {
    if (!admin_id) return; // Cannot log without admin id
    
    await db.query(
      `INSERT INTO audit_logs (admin_id, action_type, target_type, target_id, details, ip_address) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [admin_id, action_type, target_type, target_id, details || null, ip_address || null]
    );
  } catch (error) {
    console.error('Failed to record audit log:', error);
  }
};

/**
 * Log a user activity to the user_activities table.
 */
export const logActivity = async ({ user_id, activity_type, details }) => {
  try {
    if (!user_id) return;
    
    await db.query(
      `INSERT INTO user_activities (user_id, activity_type, details) 
       VALUES (?, ?, ?)`,
      [user_id, activity_type, details || null]
    );
  } catch (error) {
    console.error('Failed to record user activity:', error);
  }
};
