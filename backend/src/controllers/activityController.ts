import { Request, Response } from 'express';
import pool from '../config/database';
import { CreateActivityRequest, ActivityType } from '../types';

// Get activities with filtering
export const getActivities = async (req: Request, res: Response)=> {
  try {
    const {
      page = 1,
      limit = 20,
      lead_id,
      activity_type,
      created_by,
      date_from,
      date_to
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const params: any[] = [];
    let whereClause = 'WHERE 1=1';

    if (lead_id) {
      params.push(lead_id);
      whereClause += ` AND a.lead_id = $${params.length}`;
    }

    if (activity_type) {
      params.push(activity_type);
      whereClause += ` AND a.activity_type = $${params.length}`;
    }

    if (created_by) {
      params.push(created_by);
      whereClause += ` AND a.created_by = $${params.length}`;
    }

    if (date_from) {
      params.push(date_from);
      whereClause += ` AND a.activity_date >= $${params.length}`;
    }

    if (date_to) {
      params.push(date_to);
      whereClause += ` AND a.activity_date <= $${params.length}`;
    }

    // Count total
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM activities a ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get activities with related data
    params.push(Number(limit));
    params.push(offset);

    const query = `
      SELECT
        a.*,
        u.name as created_by_name,
        l.company_name as lead_company_name
      FROM activities a
      LEFT JOIN users u ON u.id = a.created_by
      LEFT JOIN leads l ON l.id = a.lead_id
      ${whereClause}
      ORDER BY a.activity_date DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const result = await pool.query(query, params);

    res.json({
      activities: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
};

// Get activities for a specific lead
export const getLeadActivities = async (req: Request, res: Response)=> {
  try {
    const { leadId } = req.params;
    const { limit = 50 } = req.query;

    const result = await pool.query(
      `SELECT
        a.*,
        u.name as created_by_name,
        COALESCE(
          json_agg(
            jsonb_build_object(
              'id', aa.id,
              'file_name', aa.file_name,
              'file_path', aa.file_path,
              'file_type', aa.file_type
            )
          ) FILTER (WHERE aa.id IS NOT NULL), '[]'
        ) as attachments
       FROM activities a
       LEFT JOIN users u ON u.id = a.created_by
       LEFT JOIN activity_attachments aa ON aa.activity_id = a.id
       WHERE a.lead_id = $1
       GROUP BY a.id, u.name
       ORDER BY a.activity_date DESC
       LIMIT $2`,
      [leadId, Number(limit)]
    );

    res.json({ activities: result.rows });
  } catch (error) {
    console.error('Get lead activities error:', error);
    res.status(500).json({ error: 'Failed to fetch lead activities' });
  }
};

// Get single activity
export const getActivity = async (req: Request, res: Response)=> {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
        a.*,
        u.name as created_by_name,
        l.company_name as lead_company_name,
        COALESCE(
          json_agg(
            jsonb_build_object(
              'id', aa.id,
              'file_name', aa.file_name,
              'file_path', aa.file_path,
              'file_type', aa.file_type,
              'file_size', aa.file_size
            )
          ) FILTER (WHERE aa.id IS NOT NULL), '[]'
        ) as attachments
       FROM activities a
       LEFT JOIN users u ON u.id = a.created_by
       LEFT JOIN leads l ON l.id = a.lead_id
       LEFT JOIN activity_attachments aa ON aa.activity_id = a.id
       WHERE a.id = $1
       GROUP BY a.id, u.name, l.company_name`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json({ activity: result.rows[0] });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
};

// Create activity
export const createActivity = async (req: Request, res: Response)=> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const activityData: CreateActivityRequest = req.body;
    const userId = (req as any).user?.id;

    // Insert activity
    const result = await client.query(
      `INSERT INTO activities (
        lead_id, tender_id, activity_type, activity_date,
        duration_minutes, subject, outcome, notes,
        attendees, action_items, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        activityData.lead_id,
        activityData.tender_id,
        activityData.activity_type,
        activityData.activity_date,
        activityData.duration_minutes,
        activityData.subject,
        activityData.outcome,
        activityData.notes,
        activityData.attendees,
        activityData.action_items,
        userId
      ]
    );

    const activity = result.rows[0];

    // Update lead's last_contact_date if this is a lead activity
    if (activityData.lead_id) {
      await client.query(
        `UPDATE leads SET last_contact_date = $1, updated_at = NOW() WHERE id = $2`,
        [activityData.activity_date, activityData.lead_id]
      );

      // Create follow-up task if it's a site visit
      if (activityData.activity_type === ActivityType.SITE_VISIT) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 2); // Due in 48 hours

        // Get lead's assigned user
        const leadResult = await client.query(
          'SELECT assigned_to FROM leads WHERE id = $1',
          [activityData.lead_id]
        );

        if (leadResult.rows.length > 0) {
          await client.query(
            `INSERT INTO tasks (lead_id, task_type, title, description, due_date, priority, assigned_to, auto_generated, trigger_rule, created_by)
             VALUES ($1, 'send_proposal', 'Send Proposal', 'Send proposal after site visit', $2, 'high', $3, true, 'site_visit_completed', $4)`,
            [activityData.lead_id, dueDate.toISOString().split('T')[0], leadResult.rows[0].assigned_to, userId]
          );
        }
      }
    }

    await client.query('COMMIT');

    res.status(201).json({ activity });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create activity error:', error);
    res.status(500).json({ error: 'Failed to create activity' });
  } finally {
    client.release();
  }
};

// Update activity
export const updateActivity = async (req: Request, res: Response)=> {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updateFields: string[] = [];
    const params: any[] = [];

    const allowedFields = [
      'activity_type', 'activity_date', 'duration_minutes',
      'subject', 'outcome', 'notes', 'attendees', 'action_items'
    ];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        params.push(updates[field]);
        updateFields.push(`${field} = $${params.length}`);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    params.push(id);
    const query = `
      UPDATE activities
      SET ${updateFields.join(', ')}
      WHERE id = $${params.length}
      RETURNING *
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json({ activity: result.rows[0] });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({ error: 'Failed to update activity' });
  }
};

// Delete activity
export const deleteActivity = async (req: Request, res: Response)=> {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM activities WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ error: 'Failed to delete activity' });
  }
};

// Add attachment to activity
export const addAttachment = async (req: Request, res: Response)=> {
  try {
    const { id } = req.params;
    const { file_name, file_path, file_type, file_size } = req.body;

    // Verify activity exists
    const activityResult = await pool.query(
      'SELECT id FROM activities WHERE id = $1',
      [id]
    );

    if (activityResult.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    const result = await pool.query(
      `INSERT INTO activity_attachments (activity_id, file_name, file_path, file_type, file_size)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, file_name, file_path, file_type, file_size]
    );

    res.status(201).json({ attachment: result.rows[0] });
  } catch (error) {
    console.error('Add attachment error:', error);
    res.status(500).json({ error: 'Failed to add attachment' });
  }
};

// Get activity types
export const getActivityTypes = async (_req: Request, res: Response)=> {
  try {
    res.json({
      activity_types: Object.values(ActivityType)
    });
  } catch (error) {
    console.error('Get activity types error:', error);
    res.status(500).json({ error: 'Failed to fetch activity types' });
  }
};
