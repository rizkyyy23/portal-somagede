
import db from '../config/database.js';
import { logAudit } from '../utils/logger.js';

// GET all broadcasts (Admin view - excludes soft-deleted)
export const getAllBroadcasts = async (req, res) => {
  try {
    const [broadcasts] = await db.query(
      'SELECT * FROM broadcasts WHERE deleted_at IS NULL ORDER BY created_at DESC'
    );
    res.json({ success: true, data: broadcasts });
  } catch (error) {
    console.error('Error fetching broadcasts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch broadcasts' });
  }
};

// GET all broadcasts history (Admin view - includes soft-deleted, for History tab)
export const getAllBroadcastsHistory = async (req, res) => {
  try {
    const [broadcasts] = await db.query(
      'SELECT * FROM broadcasts ORDER BY created_at DESC'
    );
    res.json({ success: true, data: broadcasts });
  } catch (error) {
    console.error('Error fetching broadcasts history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch broadcasts history' });
  }
};

// GET active broadcasts (User view - filters expired and soft-deleted)
export const getActiveBroadcasts = async (req, res) => {
  try {
    const [broadcasts] = await db.query(
      `SELECT * FROM broadcasts 
       WHERE deleted_at IS NULL
       AND (expires_at IS NULL OR expires_at > NOW()) 
       ORDER BY created_at DESC`
    );
    res.json({ success: true, data: broadcasts });
  } catch (error) {
    console.error('Error fetching active broadcasts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch broadcasts' });
  }
};

// CREATE new broadcast
export const createBroadcast = async (req, res) => {
  try {
    const { title, message, priority, target_audience, expires_at } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    const [result] = await db.query(
      'INSERT INTO broadcasts (title, message, priority, target_audience, expires_at) VALUES (?, ?, ?, ?, ?)',
      [title, message, priority || 'normal', target_audience || 'all', expires_at || null]
    );

    // Log admin action
    if (req.body.admin_id) {
      await logAudit({
        admin_id: req.body.admin_id,
        action_type: 'CREATE',
        target_type: 'BROADCAST',
        target_id: result.insertId,
        details: `Created broadcast: ${title}`,
        ip_address: req.ip
      });
    }

    res.status(201).json({ 
      success: true, 
      message: 'Broadcast created successfully',
      data: { id: result.insertId, title, message, priority, target_audience, expires_at }
    });
  } catch (error) {
    console.error('Error creating broadcast:', error);
    res.status(500).json({ success: false, message: 'Failed to create broadcast' });
  }
};

// SOFT DELETE broadcast (sets deleted_at, keeps record in history)
export const deleteBroadcast = async (req, res) => {
  try {
    const { id } = req.params;

    // Perform a soft delete by setting deleted_at timestamp
    const [result] = await db.query(
      'UPDATE broadcasts SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Broadcast not found or already deleted' });
    }

    // Log admin action
    const admin_id = req.query.admin_id || req.body.admin_id;
    if (admin_id) {
      await logAudit({
        admin_id: admin_id,
        action_type: 'DELETE',
        target_type: 'BROADCAST',
        target_id: id,
        details: `Soft-deleted broadcast ID: ${id}`,
        ip_address: req.ip
      });
    }

    res.json({ success: true, message: 'Broadcast removed from active broadcasts' });
  } catch (error) {
    console.error('Error deleting broadcast:', error);
    res.status(500).json({ success: false, message: 'Failed to delete broadcast' });
  }
};
