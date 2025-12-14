import { Request, Response } from 'express';
import pool from '../config/database';
import { calculateLeadScore, checkDuplicateLead } from '../services/leadScoringService';
import {
  LeadStatus,
  LeadTemperature,
  CreateLeadRequest,
  CreateContactRequest,
  LEAD_SOURCES,
  INDUSTRY_SECTORS,
  LOSS_REASONS
} from '../types';

// Get all leads with filtering, pagination, and search
export const getLeads = async (req: Request, res: Response)=> {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      temperature,
      lead_source,
      industry_sector,
      assigned_to,
      grade,
      state,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const params: any[] = [];
    let whereClause = 'WHERE 1=1';

    // Search by company name, city, or state
    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (
        l.company_name ILIKE $${params.length}
        OR l.city ILIKE $${params.length}
        OR l.state ILIKE $${params.length}
        OR l.gstin ILIKE $${params.length}
      )`;
    }

    // Filter by status
    if (status) {
      params.push(status);
      whereClause += ` AND l.lead_status = $${params.length}`;
    }

    // Filter by temperature
    if (temperature) {
      params.push(temperature);
      whereClause += ` AND l.temperature = $${params.length}`;
    }

    // Filter by lead source
    if (lead_source) {
      params.push(lead_source);
      whereClause += ` AND l.lead_source = $${params.length}`;
    }

    // Filter by industry sector
    if (industry_sector) {
      params.push(industry_sector);
      whereClause += ` AND l.industry_sector = $${params.length}`;
    }

    // Filter by assigned user
    if (assigned_to) {
      params.push(assigned_to);
      whereClause += ` AND l.assigned_to = $${params.length}`;
    }

    // Filter by grade
    if (grade) {
      params.push(grade);
      whereClause += ` AND l.lead_grade = $${params.length}`;
    }

    // Filter by state
    if (state) {
      params.push(state);
      whereClause += ` AND l.state = $${params.length}`;
    }

    // Validate sort column
    const validSortColumns = ['created_at', 'updated_at', 'company_name', 'lead_score', 'deal_size_estimate', 'last_contact_date'];
    const sortColumn = validSortColumns.includes(sort_by as string) ? sort_by : 'created_at';
    const sortDirection = sort_order === 'asc' ? 'ASC' : 'DESC';

    // Count total
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM leads l ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get leads with assigned user info
    params.push(Number(limit));
    params.push(offset);

    const query = `
      SELECT
        l.*,
        u.name as assigned_user_name,
        u.email as assigned_user_email
      FROM leads l
      LEFT JOIN users u ON u.id = l.assigned_to
      ${whereClause}
      ORDER BY l.${sortColumn} ${sortDirection}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const result = await pool.query(query, params);

    res.json({
      leads: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
};

// Get single lead with contacts and recent activities
export const getLead = async (req: Request, res: Response)=> {
  try {
    const { id } = req.params;

    // Get lead
    const leadResult = await pool.query(
      `SELECT l.*, u.name as assigned_user_name, u.email as assigned_user_email
       FROM leads l
       LEFT JOIN users u ON u.id = l.assigned_to
       WHERE l.id = $1`,
      [id]
    );

    if (leadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const lead = leadResult.rows[0];

    // Get contacts with emails and phones
    const contactsResult = await pool.query(
      `SELECT lc.*,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object('id', ce.id, 'email', ce.email, 'is_primary', ce.is_primary))
          FILTER (WHERE ce.id IS NOT NULL), '[]'
        ) as emails,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object('id', cp.id, 'phone', cp.phone, 'phone_type', cp.phone_type, 'is_primary', cp.is_primary))
          FILTER (WHERE cp.id IS NOT NULL), '[]'
        ) as phones
       FROM lead_contacts lc
       LEFT JOIN contact_emails ce ON ce.contact_id = lc.id
       LEFT JOIN contact_phones cp ON cp.contact_id = lc.id
       WHERE lc.lead_id = $1
       GROUP BY lc.id
       ORDER BY lc.is_primary DESC, lc.created_at ASC`,
      [id]
    );

    // Get recent activities
    const activitiesResult = await pool.query(
      `SELECT a.*, u.name as created_by_name
       FROM activities a
       LEFT JOIN users u ON u.id = a.created_by
       WHERE a.lead_id = $1
       ORDER BY a.activity_date DESC
       LIMIT 10`,
      [id]
    );

    // Get stage history
    const historyResult = await pool.query(
      `SELECT sh.*, u.name as changed_by_name
       FROM lead_stage_history sh
       LEFT JOIN users u ON u.id = sh.changed_by
       WHERE sh.lead_id = $1
       ORDER BY sh.changed_at DESC
       LIMIT 20`,
      [id]
    );

    res.json({
      lead: {
        ...lead,
        contacts: contactsResult.rows,
        recent_activities: activitiesResult.rows,
        stage_history: historyResult.rows
      }
    });
  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
};

// Create new lead
export const createLead = async (req: Request, res: Response)=> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const leadData: CreateLeadRequest = req.body;
    const userId = (req as any).user?.id;

    // Check for duplicates
    const primaryEmail = leadData.contacts?.[0]?.emails?.find(e => e.is_primary)?.email
      || leadData.contacts?.[0]?.emails?.[0]?.email;
    const primaryPhone = leadData.contacts?.[0]?.phones?.find(p => p.is_primary)?.phone
      || leadData.contacts?.[0]?.phones?.[0]?.phone;

    const duplicateCheck = await checkDuplicateLead(
      client,
      leadData.company_name,
      primaryEmail,
      primaryPhone
    );

    // Calculate lead score
    const scoreResult = calculateLeadScore({
      monthly_consumption_kwh: leadData.monthly_consumption_kwh,
      ownership_status: leadData.ownership_status,
      lease_remaining_years: leadData.lease_remaining_years,
      current_tariff_per_kwh: leadData.current_tariff_per_kwh,
      industry_sector: leadData.industry_sector,
      has_solar: leadData.has_solar,
      deal_size_estimate: leadData.deal_size_estimate
    });

    // Insert lead
    const leadResult = await client.query(
      `INSERT INTO leads (
        company_name, gstin, website_url,
        address_full, city, state, pin_code,
        industry_sector, sanctioned_load_kva, monthly_consumption_kwh, current_tariff_per_kwh,
        has_solar, solar_capacity_kw, has_battery, battery_capacity_kwh, has_dg, dg_capacity_kva,
        roof_type, available_area_sqft, ownership_status, lease_remaining_years,
        lead_score, lead_grade, lead_status, temperature,
        assigned_to, lead_source, lead_source_detail,
        deal_size_estimate, preferred_model,
        is_duplicate_flag, duplicate_of,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33)
      RETURNING *`,
      [
        leadData.company_name,
        leadData.gstin,
        leadData.website_url,
        leadData.address_full,
        leadData.city,
        leadData.state,
        leadData.pin_code,
        leadData.industry_sector,
        leadData.sanctioned_load_kva,
        leadData.monthly_consumption_kwh,
        leadData.current_tariff_per_kwh,
        leadData.has_solar || false,
        leadData.solar_capacity_kw,
        leadData.has_battery || false,
        leadData.battery_capacity_kwh,
        leadData.has_dg || false,
        leadData.dg_capacity_kva,
        leadData.roof_type,
        leadData.available_area_sqft,
        leadData.ownership_status,
        leadData.lease_remaining_years,
        scoreResult.score,
        scoreResult.grade,
        LeadStatus.NEW,
        leadData.temperature || LeadTemperature.COLD,
        leadData.assigned_to,
        leadData.lead_source,
        leadData.lead_source_detail,
        leadData.deal_size_estimate,
        leadData.preferred_model,
        duplicateCheck.isDuplicate,
        duplicateCheck.duplicateId,
        userId
      ]
    );

    const lead = leadResult.rows[0];

    // Insert contacts if provided
    if (leadData.contacts && leadData.contacts.length > 0) {
      for (const contact of leadData.contacts) {
        const contactResult = await client.query(
          `INSERT INTO lead_contacts (lead_id, name, designation, is_primary)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [lead.id, contact.name, contact.designation, contact.is_primary || false]
        );

        const contactId = contactResult.rows[0].id;

        // Insert emails
        if (contact.emails && contact.emails.length > 0) {
          for (const email of contact.emails) {
            await client.query(
              `INSERT INTO contact_emails (contact_id, email, is_primary)
               VALUES ($1, $2, $3)`,
              [contactId, email.email, email.is_primary || false]
            );
          }
        }

        // Insert phones
        if (contact.phones && contact.phones.length > 0) {
          for (const phone of contact.phones) {
            await client.query(
              `INSERT INTO contact_phones (contact_id, phone, phone_type, is_primary)
               VALUES ($1, $2, $3, $4)`,
              [contactId, phone.phone, phone.phone_type, phone.is_primary || false]
            );
          }
        }
      }
    }

    // Record initial stage in history
    await client.query(
      `INSERT INTO lead_stage_history (lead_id, from_status, to_status, changed_by, notes)
       VALUES ($1, NULL, $2, $3, 'Lead created')`,
      [lead.id, LeadStatus.NEW, userId]
    );

    // If assigned, record assignment history
    if (leadData.assigned_to) {
      await client.query(
        `INSERT INTO lead_assignment_history (lead_id, from_user, to_user, assigned_by, reason)
         VALUES ($1, NULL, $2, $3, 'Initial assignment')`,
        [lead.id, leadData.assigned_to, userId]
      );

      // Create notification for assigned user
      await client.query(
        `INSERT INTO notifications (user_id, notification_type, title, message, entity_type, entity_id)
         VALUES ($1, 'lead_assigned', 'New Lead Assigned', $2, 'lead', $3)`,
        [leadData.assigned_to, `New lead: ${leadData.company_name}`, lead.id]
      );

      // Create first contact task
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      await client.query(
        `INSERT INTO tasks (lead_id, task_type, title, description, due_date, priority, assigned_to, auto_generated, trigger_rule, created_by)
         VALUES ($1, 'follow_up_call', 'First Contact', 'Make initial contact with the lead', $2, 'high', $3, true, 'new_lead_created', $4)`,
        [lead.id, tomorrow.toISOString().split('T')[0], leadData.assigned_to, userId]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      lead,
      scoreBreakdown: scoreResult.breakdown,
      duplicateWarning: duplicateCheck.isDuplicate ? duplicateCheck.matchReason : null
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create lead error:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  } finally {
    client.release();
  }
};

// Update lead
export const updateLead = async (req: Request, res: Response)=> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const updates = req.body;

    // Get current lead
    const currentLeadResult = await client.query(
      'SELECT * FROM leads WHERE id = $1',
      [id]
    );

    if (currentLeadResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Lead not found' });
    }

    const currentLead = currentLeadResult.rows[0];

    // Build update query dynamically
    const updateFields: string[] = [];
    const params: any[] = [];

    const allowedFields = [
      'company_name', 'gstin', 'website_url',
      'address_full', 'city', 'state', 'pin_code',
      'industry_sector', 'sanctioned_load_kva', 'monthly_consumption_kwh', 'current_tariff_per_kwh',
      'has_solar', 'solar_capacity_kw', 'has_battery', 'battery_capacity_kwh', 'has_dg', 'dg_capacity_kva',
      'roof_type', 'available_area_sqft', 'ownership_status', 'lease_remaining_years',
      'temperature', 'lead_source', 'lead_source_detail',
      'last_contact_date', 'next_action_date', 'deal_size_estimate', 'preferred_model',
      'loss_reason', 'loss_notes'
    ];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        params.push(updates[field]);
        updateFields.push(`${field} = $${params.length}`);
      }
    }

    // Recalculate score if relevant fields changed
    const scoreFields = ['monthly_consumption_kwh', 'ownership_status', 'lease_remaining_years',
      'current_tariff_per_kwh', 'last_contact_date', 'industry_sector', 'has_solar', 'deal_size_estimate'];

    const shouldRecalculateScore = scoreFields.some(f => updates[f] !== undefined);

    if (shouldRecalculateScore) {
      const mergedData = { ...currentLead, ...updates };
      const scoreResult = calculateLeadScore({
        monthly_consumption_kwh: mergedData.monthly_consumption_kwh,
        ownership_status: mergedData.ownership_status,
        lease_remaining_years: mergedData.lease_remaining_years,
        current_tariff_per_kwh: mergedData.current_tariff_per_kwh,
        last_contact_date: mergedData.last_contact_date,
        industry_sector: mergedData.industry_sector,
        has_solar: mergedData.has_solar,
        deal_size_estimate: mergedData.deal_size_estimate
      });

      params.push(scoreResult.score);
      updateFields.push(`lead_score = $${params.length}`);
      params.push(scoreResult.grade);
      updateFields.push(`lead_grade = $${params.length}`);
    }

    if (updateFields.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    params.push(id);
    const updateQuery = `
      UPDATE leads
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${params.length}
      RETURNING *
    `;

    const result = await client.query(updateQuery, params);

    await client.query('COMMIT');

    res.json({ lead: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update lead error:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  } finally {
    client.release();
  }
};

// Update lead status
export const updateLeadStatus = async (req: Request, res: Response)=> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { status, loss_reason, loss_notes, notes } = req.body;
    const userId = (req as any).user?.id;

    // Get current lead
    const currentResult = await client.query(
      'SELECT lead_status, company_name, assigned_to FROM leads WHERE id = $1',
      [id]
    );

    if (currentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Lead not found' });
    }

    const currentLead = currentResult.rows[0];
    const previousStatus = currentLead.lead_status;

    // Update lead status
    const updateParams: any[] = [status, id];
    let updateQuery = 'UPDATE leads SET lead_status = $1';

    if (status === LeadStatus.LOST && loss_reason) {
      updateParams.splice(1, 0, loss_reason, loss_notes);
      updateQuery = 'UPDATE leads SET lead_status = $1, loss_reason = $2, loss_notes = $3';
      updateParams.push(id);
    }

    updateQuery += `, updated_at = NOW() WHERE id = $${updateParams.length} RETURNING *`;

    const result = await client.query(updateQuery, updateParams);

    // Record stage history
    await client.query(
      `INSERT INTO lead_stage_history (lead_id, from_status, to_status, changed_by, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, previousStatus, status, userId, notes]
    );

    // Create task automation based on stage change
    if (status === LeadStatus.WON) {
      // Create handoff task
      await client.query(
        `INSERT INTO tasks (lead_id, task_type, title, description, due_date, priority, assigned_to, auto_generated, trigger_rule, created_by)
         VALUES ($1, 'handoff_to_projects', 'Handoff to Projects', 'Hand over won deal to projects team', CURRENT_DATE + INTERVAL '1 day', 'high', $2, true, 'deal_won', $3)`,
        [id, currentLead.assigned_to, userId]
      );

      // Create notification
      if (currentLead.assigned_to) {
        await client.query(
          `INSERT INTO notifications (user_id, notification_type, title, message, entity_type, entity_id)
           VALUES ($1, 'deal_won', 'Deal Won!', $2, 'lead', $3)`,
          [currentLead.assigned_to, `Congratulations! ${currentLead.company_name} is won!`, id]
        );
      }
    }

    await client.query('COMMIT');

    res.json({ lead: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update lead status error:', error);
    res.status(500).json({ error: 'Failed to update lead status' });
  } finally {
    client.release();
  }
};

// Assign lead to user
export const assignLead = async (req: Request, res: Response)=> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { assigned_to, reason } = req.body;
    const userId = (req as any).user?.id;

    // Get current assignment
    const currentResult = await client.query(
      'SELECT assigned_to, company_name FROM leads WHERE id = $1',
      [id]
    );

    if (currentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Lead not found' });
    }

    const previousAssigned = currentResult.rows[0].assigned_to;
    const companyName = currentResult.rows[0].company_name;

    // Update lead
    const result = await client.query(
      'UPDATE leads SET assigned_to = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [assigned_to, id]
    );

    // Record assignment history
    await client.query(
      `INSERT INTO lead_assignment_history (lead_id, from_user, to_user, assigned_by, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, previousAssigned, assigned_to, userId, reason]
    );

    // Create notification for new assignee
    if (assigned_to) {
      await client.query(
        `INSERT INTO notifications (user_id, notification_type, title, message, entity_type, entity_id)
         VALUES ($1, 'lead_assigned', 'Lead Assigned', $2, 'lead', $3)`,
        [assigned_to, `Lead "${companyName}" has been assigned to you`, id]
      );
    }

    await client.query('COMMIT');

    res.json({ lead: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Assign lead error:', error);
    res.status(500).json({ error: 'Failed to assign lead' });
  } finally {
    client.release();
  }
};

// Add contact to lead
export const addContact = async (req: Request, res: Response)=> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const contact: CreateContactRequest = req.body;

    // Verify lead exists
    const leadResult = await client.query('SELECT id FROM leads WHERE id = $1', [id]);
    if (leadResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Insert contact
    const contactResult = await client.query(
      `INSERT INTO lead_contacts (lead_id, name, designation, is_primary)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, contact.name, contact.designation, contact.is_primary || false]
    );

    const newContact = contactResult.rows[0];

    // Insert emails
    if (contact.emails && contact.emails.length > 0) {
      for (const email of contact.emails) {
        await client.query(
          `INSERT INTO contact_emails (contact_id, email, is_primary)
           VALUES ($1, $2, $3)`,
          [newContact.id, email.email, email.is_primary || false]
        );
      }
    }

    // Insert phones
    if (contact.phones && contact.phones.length > 0) {
      for (const phone of contact.phones) {
        await client.query(
          `INSERT INTO contact_phones (contact_id, phone, phone_type, is_primary)
           VALUES ($1, $2, $3, $4)`,
          [newContact.id, phone.phone, phone.phone_type, phone.is_primary || false]
        );
      }
    }

    await client.query('COMMIT');

    // Fetch complete contact with emails and phones
    const completeContact = await pool.query(
      `SELECT lc.*,
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', ce.id, 'email', ce.email, 'is_primary', ce.is_primary)) FILTER (WHERE ce.id IS NOT NULL), '[]') as emails,
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', cp.id, 'phone', cp.phone, 'phone_type', cp.phone_type, 'is_primary', cp.is_primary)) FILTER (WHERE cp.id IS NOT NULL), '[]') as phones
       FROM lead_contacts lc
       LEFT JOIN contact_emails ce ON ce.contact_id = lc.id
       LEFT JOIN contact_phones cp ON cp.contact_id = lc.id
       WHERE lc.id = $1
       GROUP BY lc.id`,
      [newContact.id]
    );

    res.status(201).json({ contact: completeContact.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Add contact error:', error);
    res.status(500).json({ error: 'Failed to add contact' });
  } finally {
    client.release();
  }
};

// Recalculate lead score
export const recalculateScore = async (req: Request, res: Response)=> {
  try {
    const { id } = req.params;

    const leadResult = await pool.query('SELECT * FROM leads WHERE id = $1', [id]);

    if (leadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const lead = leadResult.rows[0];

    const scoreResult = calculateLeadScore({
      monthly_consumption_kwh: lead.monthly_consumption_kwh,
      ownership_status: lead.ownership_status,
      lease_remaining_years: lead.lease_remaining_years,
      current_tariff_per_kwh: lead.current_tariff_per_kwh,
      last_contact_date: lead.last_contact_date,
      industry_sector: lead.industry_sector,
      has_solar: lead.has_solar,
      deal_size_estimate: lead.deal_size_estimate
    });

    // Update lead score
    await pool.query(
      'UPDATE leads SET lead_score = $1, lead_grade = $2, updated_at = NOW() WHERE id = $3',
      [scoreResult.score, scoreResult.grade, id]
    );

    res.json({
      score: scoreResult.score,
      grade: scoreResult.grade,
      breakdown: scoreResult.breakdown
    });
  } catch (error) {
    console.error('Recalculate score error:', error);
    res.status(500).json({ error: 'Failed to recalculate score' });
  }
};

// Delete lead
export const deleteLead = async (req: Request, res: Response)=> {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM leads WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
};

// Get lead options (for dropdowns)
export const getLeadOptions = async (_req: Request, res: Response)=> {
  try {
    res.json({
      lead_sources: LEAD_SOURCES,
      industry_sectors: INDUSTRY_SECTORS,
      loss_reasons: LOSS_REASONS,
      statuses: Object.values(LeadStatus),
      temperatures: Object.values(LeadTemperature)
    });
  } catch (error) {
    console.error('Get lead options error:', error);
    res.status(500).json({ error: 'Failed to fetch options' });
  }
};

// Get pipeline summary
export const getPipelineSummary = async (req: Request, res: Response)=> {
  try {
    const { assigned_to } = req.query;

    let whereClause = "WHERE lead_status NOT IN ('Won', 'Lost')";
    const params: any[] = [];

    if (assigned_to) {
      params.push(assigned_to);
      whereClause += ` AND assigned_to = $${params.length}`;
    }

    const result = await pool.query(
      `SELECT
        lead_status,
        COUNT(*) as count,
        COALESCE(SUM(deal_size_estimate), 0) as total_value,
        COALESCE(AVG(lead_score), 0) as avg_score
       FROM leads
       ${whereClause}
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

    res.json({ pipeline: result.rows });
  } catch (error) {
    console.error('Get pipeline summary error:', error);
    res.status(500).json({ error: 'Failed to fetch pipeline summary' });
  }
};
