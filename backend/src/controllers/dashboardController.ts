import { Request, Response } from 'express';
import pool from '../config/database';
import { UserRole } from '../types';

// Get dashboard overview
export const getDashboardOverview = async (req: Request, res: Response)=> {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    // Build filter based on user role
    let userFilter = '';
    const params: any[] = [];

    if (userRole === UserRole.SALES_REP) {
      params.push(userId);
      userFilter = `AND assigned_to = $${params.length}`;
    }

    // Pipeline summary
    const pipelineResult = await pool.query(
      `SELECT
        lead_status,
        COUNT(*) as count,
        COALESCE(SUM(deal_size_estimate), 0) as total_value
       FROM leads
       WHERE lead_status NOT IN ('Won', 'Lost') ${userFilter}
       GROUP BY lead_status
       ORDER BY
         CASE lead_status
           WHEN 'New' THEN 1
           WHEN 'Qualified' THEN 2
           WHEN 'Site Survey' THEN 3
           WHEN 'Proposal' THEN 4
           WHEN 'Negotiation' THEN 5
         END`,
      params
    );

    // Calculate total pipeline value
    let totalPipelineValue = 0;
    pipelineResult.rows.forEach(row => {
      totalPipelineValue += parseFloat(row.total_value) || 0;
    });

    // KPIs
    const kpisResult = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE lead_status NOT IN ('Won', 'Lost')) as active_leads,
        COUNT(*) FILTER (WHERE lead_status = 'Won' AND updated_at >= CURRENT_DATE - INTERVAL '30 days') as won_this_month,
        COUNT(*) FILTER (WHERE lead_status = 'Lost' AND updated_at >= CURRENT_DATE - INTERVAL '30 days') as lost_this_month,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_leads_this_month,
        COALESCE(SUM(deal_size_estimate) FILTER (WHERE lead_status = 'Won' AND updated_at >= CURRENT_DATE - INTERVAL '30 days'), 0) as won_value_this_month
       FROM leads
       WHERE 1=1 ${userFilter}`,
      params
    );

    // Win rate calculation
    const winRateResult = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE lead_status = 'Won') as won,
        COUNT(*) FILTER (WHERE lead_status IN ('Won', 'Lost')) as total_closed
       FROM leads
       WHERE updated_at >= CURRENT_DATE - INTERVAL '90 days' ${userFilter}`,
      params
    );

    const won = parseInt(winRateResult.rows[0].won) || 0;
    const totalClosed = parseInt(winRateResult.rows[0].total_closed) || 0;
    const winRate = totalClosed > 0 ? Math.round((won / totalClosed) * 100) : 0;

    // Overdue tasks
    const overdueTasksResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM tasks
       WHERE due_date < CURRENT_DATE
         AND status NOT IN ('completed', 'cancelled')
         ${userRole === UserRole.SALES_REP ? 'AND assigned_to = $1' : ''}`,
      userRole === UserRole.SALES_REP ? [userId] : []
    );

    // Tasks due today
    const todayTasksResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM tasks
       WHERE due_date = CURRENT_DATE
         AND status NOT IN ('completed', 'cancelled')
         ${userRole === UserRole.SALES_REP ? 'AND assigned_to = $1' : ''}`,
      userRole === UserRole.SALES_REP ? [userId] : []
    );

    res.json({
      pipeline: pipelineResult.rows,
      totalPipelineValue,
      kpis: {
        activeLeads: parseInt(kpisResult.rows[0].active_leads) || 0,
        wonThisMonth: parseInt(kpisResult.rows[0].won_this_month) || 0,
        lostThisMonth: parseInt(kpisResult.rows[0].lost_this_month) || 0,
        newLeadsThisMonth: parseInt(kpisResult.rows[0].new_leads_this_month) || 0,
        wonValueThisMonth: parseFloat(kpisResult.rows[0].won_value_this_month) || 0,
        winRate,
        overdueTasks: parseInt(overdueTasksResult.rows[0].count) || 0,
        tasksDueToday: parseInt(todayTasksResult.rows[0].count) || 0
      }
    });
  } catch (error) {
    console.error('Get dashboard overview error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

// Get lead source analytics
export const getLeadSourceAnalytics = async (req: Request, res: Response)=> {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    let userFilter = '';
    const params: any[] = [];

    if (userRole === UserRole.SALES_REP) {
      params.push(userId);
      userFilter = `AND assigned_to = $${params.length}`;
    }

    const result = await pool.query(
      `SELECT
        lead_source,
        COUNT(*) as total_leads,
        COUNT(*) FILTER (WHERE lead_status = 'Won') as won,
        COUNT(*) FILTER (WHERE lead_status = 'Lost') as lost,
        COALESCE(SUM(deal_size_estimate) FILTER (WHERE lead_status = 'Won'), 0) as won_value
       FROM leads
       WHERE lead_source IS NOT NULL ${userFilter}
       GROUP BY lead_source
       ORDER BY total_leads DESC`,
      params
    );

    // Calculate win rates
    const analytics = result.rows.map(row => ({
      ...row,
      win_rate: parseInt(row.won) + parseInt(row.lost) > 0
        ? Math.round((parseInt(row.won) / (parseInt(row.won) + parseInt(row.lost))) * 100)
        : 0
    }));

    res.json({ analytics });
  } catch (error) {
    console.error('Get lead source analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch lead source analytics' });
  }
};

// Get sales rep performance
export const getSalesRepPerformance = async (_req: Request, res: Response)=> {
  try {
    const result = await pool.query(
      `SELECT
        u.id,
        u.name,
        u.region,
        COUNT(l.id) as total_leads,
        COUNT(l.id) FILTER (WHERE l.lead_status = 'Won') as won_deals,
        COALESCE(SUM(l.deal_size_estimate) FILTER (WHERE l.lead_status = 'Won'), 0) as won_value,
        COUNT(l.id) FILTER (WHERE l.lead_status NOT IN ('Won', 'Lost')) as active_pipeline,
        COALESCE(SUM(l.deal_size_estimate) FILTER (WHERE l.lead_status NOT IN ('Won', 'Lost')), 0) as pipeline_value,
        COUNT(t.id) FILTER (WHERE t.status = 'completed' AND t.completed_at >= CURRENT_DATE - INTERVAL '30 days') as tasks_completed
       FROM users u
       LEFT JOIN leads l ON l.assigned_to = u.id
       LEFT JOIN tasks t ON t.assigned_to = u.id
       WHERE u.role = 'sales_rep' AND u.is_active = true
       GROUP BY u.id, u.name, u.region
       ORDER BY won_value DESC`
    );

    res.json({ performance: result.rows });
  } catch (error) {
    console.error('Get sales rep performance error:', error);
    res.status(500).json({ error: 'Failed to fetch sales rep performance' });
  }
};

// Get recent activities
export const getRecentActivities = async (req: Request, res: Response)=> {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    const { limit = 10 } = req.query;

    let whereClause = '';
    const params: any[] = [Number(limit)];

    if (userRole === UserRole.SALES_REP) {
      params.push(userId);
      whereClause = `WHERE a.created_by = $${params.length}`;
    }

    const result = await pool.query(
      `SELECT
        a.*,
        u.name as created_by_name,
        l.company_name as lead_company_name
       FROM activities a
       LEFT JOIN users u ON u.id = a.created_by
       LEFT JOIN leads l ON l.id = a.lead_id
       ${whereClause}
       ORDER BY a.activity_date DESC
       LIMIT $1`,
      params
    );

    res.json({ activities: result.rows });
  } catch (error) {
    console.error('Get recent activities error:', error);
    res.status(500).json({ error: 'Failed to fetch recent activities' });
  }
};

// Get pipeline trend (last 6 months)
export const getPipelineTrend = async (req: Request, res: Response)=> {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    let userFilter = '';
    const params: any[] = [];

    if (userRole === UserRole.SALES_REP) {
      params.push(userId);
      userFilter = `AND assigned_to = $${params.length}`;
    }

    const result = await pool.query(
      `SELECT
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as new_leads,
        COUNT(*) FILTER (WHERE lead_status = 'Won') as won,
        COUNT(*) FILTER (WHERE lead_status = 'Lost') as lost,
        COALESCE(SUM(deal_size_estimate) FILTER (WHERE lead_status = 'Won'), 0) as won_value
       FROM leads
       WHERE created_at >= CURRENT_DATE - INTERVAL '6 months' ${userFilter}
       GROUP BY DATE_TRUNC('month', created_at)
       ORDER BY month DESC`,
      params
    );

    res.json({ trend: result.rows });
  } catch (error) {
    console.error('Get pipeline trend error:', error);
    res.status(500).json({ error: 'Failed to fetch pipeline trend' });
  }
};

// Get notifications
export const getNotifications = async (req: Request, res: Response)=> {
  try {
    const userId = (req as any).user?.id;
    const { unread_only = 'false', limit = 20 } = req.query;

    let whereClause = 'WHERE user_id = $1';
    const params: any[] = [userId];

    if (unread_only === 'true') {
      whereClause += ' AND is_read = false';
    }

    params.push(Number(limit));

    const result = await pool.query(
      `SELECT * FROM notifications
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length}`,
      params
    );

    // Count unread
    const unreadResult = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    res.json({
      notifications: result.rows,
      unreadCount: parseInt(unreadResult.rows[0].count) || 0
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// Mark notification as read
export const markNotificationRead = async (req: Request, res: Response)=> {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const result = await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ notification: result.rows[0] });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
};

// Mark all notifications as read
export const markAllNotificationsRead = async (req: Request, res: Response)=> {
  try {
    const userId = (req as any).user?.id;

    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
};
