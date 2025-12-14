import { Request, Response } from 'express';
import pool from '../config/database';
import { CreateTaskRequest, TaskType, TaskStatus, TaskPriority } from '../types';

// Get tasks with filtering
export const getTasks = async (req: Request, res: Response)=> {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      task_type,
      assigned_to,
      lead_id,
      due_date_from,
      due_date_to,
      overdue_only
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const params: any[] = [];
    let whereClause = 'WHERE 1=1';

    if (status) {
      params.push(status);
      whereClause += ` AND t.status = $${params.length}`;
    }

    if (priority) {
      params.push(priority);
      whereClause += ` AND t.priority = $${params.length}`;
    }

    if (task_type) {
      params.push(task_type);
      whereClause += ` AND t.task_type = $${params.length}`;
    }

    if (assigned_to) {
      params.push(assigned_to);
      whereClause += ` AND t.assigned_to = $${params.length}`;
    }

    if (lead_id) {
      params.push(lead_id);
      whereClause += ` AND t.lead_id = $${params.length}`;
    }

    if (due_date_from) {
      params.push(due_date_from);
      whereClause += ` AND t.due_date >= $${params.length}`;
    }

    if (due_date_to) {
      params.push(due_date_to);
      whereClause += ` AND t.due_date <= $${params.length}`;
    }

    if (overdue_only === 'true') {
      whereClause += ` AND t.due_date < CURRENT_DATE AND t.status NOT IN ('completed', 'cancelled')`;
    }

    // Count total
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM tasks t ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get tasks with related data
    params.push(Number(limit));
    params.push(offset);

    const query = `
      SELECT
        t.*,
        u.name as assigned_user_name,
        l.company_name as lead_company_name,
        cu.name as created_by_name
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_to
      LEFT JOIN leads l ON l.id = t.lead_id
      LEFT JOIN users cu ON cu.id = t.created_by
      ${whereClause}
      ORDER BY
        CASE t.status
          WHEN 'pending' THEN 1
          WHEN 'in_progress' THEN 2
          WHEN 'completed' THEN 3
          WHEN 'cancelled' THEN 4
        END,
        CASE t.priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        t.due_date ASC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const result = await pool.query(query, params);

    res.json({
      tasks: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

// Get tasks due today
export const getTodayTasks = async (req: Request, res: Response)=> {
  try {
    const userId = (req as any).user?.id;
    const { assigned_to } = req.query;

    const targetUser = assigned_to || userId;

    const result = await pool.query(
      `SELECT
        t.*,
        l.company_name as lead_company_name
       FROM tasks t
       LEFT JOIN leads l ON l.id = t.lead_id
       WHERE t.assigned_to = $1
         AND t.due_date = CURRENT_DATE
         AND t.status NOT IN ('completed', 'cancelled')
       ORDER BY
         CASE t.priority
           WHEN 'urgent' THEN 1
           WHEN 'high' THEN 2
           WHEN 'medium' THEN 3
           WHEN 'low' THEN 4
         END,
         t.due_time ASC NULLS LAST`,
      [targetUser]
    );

    res.json({ tasks: result.rows });
  } catch (error) {
    console.error('Get today tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s tasks' });
  }
};

// Get overdue tasks
export const getOverdueTasks = async (req: Request, res: Response)=> {
  try {
    const userId = (req as any).user?.id;
    const { assigned_to } = req.query;

    const targetUser = assigned_to || userId;

    const result = await pool.query(
      `SELECT
        t.*,
        l.company_name as lead_company_name,
        CURRENT_DATE - t.due_date as days_overdue
       FROM tasks t
       LEFT JOIN leads l ON l.id = t.lead_id
       WHERE t.assigned_to = $1
         AND t.due_date < CURRENT_DATE
         AND t.status NOT IN ('completed', 'cancelled')
       ORDER BY t.due_date ASC`,
      [targetUser]
    );

    res.json({ tasks: result.rows });
  } catch (error) {
    console.error('Get overdue tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch overdue tasks' });
  }
};

// Get single task
export const getTask = async (req: Request, res: Response)=> {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
        t.*,
        u.name as assigned_user_name,
        l.company_name as lead_company_name,
        cu.name as created_by_name,
        cou.name as completed_by_name
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assigned_to
       LEFT JOIN leads l ON l.id = t.lead_id
       LEFT JOIN users cu ON cu.id = t.created_by
       LEFT JOIN users cou ON cou.id = t.completed_by
       WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ task: result.rows[0] });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
};

// Create task
export const createTask = async (req: Request, res: Response)=> {
  try {
    const taskData: CreateTaskRequest = req.body;
    const userId = (req as any).user?.id;

    const result = await pool.query(
      `INSERT INTO tasks (
        lead_id, tender_id, task_type, title, description,
        due_date, due_time, priority, assigned_to, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        taskData.lead_id,
        taskData.tender_id,
        taskData.task_type,
        taskData.title,
        taskData.description,
        taskData.due_date,
        taskData.due_time,
        taskData.priority || TaskPriority.MEDIUM,
        taskData.assigned_to,
        userId
      ]
    );

    const task = result.rows[0];

    // Create notification for assigned user
    if (taskData.assigned_to && taskData.assigned_to !== userId) {
      await pool.query(
        `INSERT INTO notifications (user_id, notification_type, title, message, entity_type, entity_id)
         VALUES ($1, 'task_assigned', 'New Task Assigned', $2, 'task', $3)`,
        [taskData.assigned_to, `Task: ${taskData.title}`, task.id]
      );
    }

    res.status(201).json({ task });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

// Update task
export const updateTask = async (req: Request, res: Response)=> {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updateFields: string[] = [];
    const params: any[] = [];

    const allowedFields = [
      'task_type', 'title', 'description', 'due_date', 'due_time',
      'priority', 'status', 'assigned_to'
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
      UPDATE tasks
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${params.length}
      RETURNING *
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ task: result.rows[0] });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

// Complete task
export const completeTask = async (req: Request, res: Response)=> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { notes: _notes } = req.body; // Reserved for future completion notes feature
    const userId = (req as any).user?.id;

    // Get current task
    const taskResult = await client.query(
      'SELECT * FROM tasks WHERE id = $1',
      [id]
    );

    if (taskResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskResult.rows[0];

    // Update task
    const result = await client.query(
      `UPDATE tasks
       SET status = 'completed', completed_at = NOW(), completed_by = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [userId, id]
    );

    // Handle task automation based on task type
    if (task.lead_id) {
      // If it's a "send_proposal" task, create follow-up task
      if (task.task_type === TaskType.SEND_PROPOSAL) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 3); // Due in 3 days

        await client.query(
          `INSERT INTO tasks (lead_id, task_type, title, description, due_date, priority, assigned_to, auto_generated, trigger_rule, created_by)
           VALUES ($1, 'proposal_follow_up', 'Proposal Follow-up', 'Follow up on sent proposal', $2, 'high', $3, true, 'proposal_sent', $4)`,
          [task.lead_id, dueDate.toISOString().split('T')[0], task.assigned_to, userId]
        );
      }
    }

    await client.query('COMMIT');

    res.json({ task: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Complete task error:', error);
    res.status(500).json({ error: 'Failed to complete task' });
  } finally {
    client.release();
  }
};

// Delete task
export const deleteTask = async (req: Request, res: Response)=> {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

// Get task stats
export const getTaskStats = async (req: Request, res: Response)=> {
  try {
    const userId = (req as any).user?.id;
    const { assigned_to } = req.query;

    const targetUser = assigned_to || userId;

    const result = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE due_date = CURRENT_DATE AND status NOT IN ('completed', 'cancelled')) as due_today,
        COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status NOT IN ('completed', 'cancelled')) as overdue,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'completed' AND completed_at >= CURRENT_DATE - INTERVAL '7 days') as completed_this_week
       FROM tasks
       WHERE assigned_to = $1`,
      [targetUser]
    );

    res.json({ stats: result.rows[0] });
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({ error: 'Failed to fetch task stats' });
  }
};

// Get task types
export const getTaskTypes = async (_req: Request, res: Response)=> {
  try {
    res.json({
      task_types: Object.values(TaskType),
      statuses: Object.values(TaskStatus),
      priorities: Object.values(TaskPriority)
    });
  } catch (error) {
    console.error('Get task types error:', error);
    res.status(500).json({ error: 'Failed to fetch task types' });
  }
};
