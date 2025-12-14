import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';
import { DEFAULT_PROBABILITY } from '../types';

export const getOpportunities = async (req: AuthRequest, res: Response)=> {
  try {
    const {
      status,
      sales_stage,
      lead_source,
      owner_name,
      location,
      industry,
      model
    } = req.query;

    let query = `
      SELECT
        o.*,
        c.name as company_name,
        c.industry,
        c.location,
        c.model,
        c.capacity_mw as company_capacity
      FROM opportunities o
      INNER JOIN companies c ON o.company_id = c.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (status) {
      query += ` AND o.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (sales_stage) {
      query += ` AND o.sales_stage = $${paramCount}`;
      params.push(sales_stage);
      paramCount++;
    }

    if (lead_source) {
      query += ` AND o.lead_source = $${paramCount}`;
      params.push(lead_source);
      paramCount++;
    }

    if (owner_name) {
      query += ` AND o.owner_name ILIKE $${paramCount}`;
      params.push(`%${owner_name}%`);
      paramCount++;
    }

    if (location) {
      query += ` AND c.location ILIKE $${paramCount}`;
      params.push(`%${location}%`);
      paramCount++;
    }

    if (industry) {
      query += ` AND c.industry ILIKE $${paramCount}`;
      params.push(`%${industry}%`);
      paramCount++;
    }

    if (model) {
      query += ` AND c.model = $${paramCount}`;
      params.push(model);
      paramCount++;
    }

    query += ' ORDER BY o.created_at DESC';

    const result = await pool.query(query, params);

    res.json({ data: result.rows });
  } catch (error) {
    console.error('Get opportunities error:', error);
    res.status(500).json({ error: 'Failed to fetch opportunities' });
  }
};

export const getOpportunityById = async (req: AuthRequest, res: Response)=> {
  try {
    const { id } = req.params;

    const opportunityResult = await pool.query(
      `SELECT
        o.*,
        c.name as company_name,
        c.industry,
        c.location,
        c.model,
        c.status as company_status,
        c.capacity_mw as company_capacity,
        c.re_consumption
      FROM opportunities o
      INNER JOIN companies c ON o.company_id = c.id
      WHERE o.id = $1`,
      [id]
    );

    if (opportunityResult.rows.length === 0) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    // Get stage history
    const historyResult = await pool.query(
      'SELECT * FROM stage_history WHERE opportunity_id = $1 ORDER BY changed_at DESC',
      [id]
    );

    // Get notes
    const notesResult = await pool.query(
      'SELECT * FROM notes WHERE opportunity_id = $1 ORDER BY created_at DESC',
      [id]
    );

    res.json({
      opportunity: opportunityResult.rows[0],
      history: historyResult.rows,
      notes: notesResult.rows
    });
  } catch (error) {
    console.error('Get opportunity error:', error);
    res.status(500).json({ error: 'Failed to fetch opportunity' });
  }
};

export const createOpportunity = async (req: AuthRequest, res: Response)=> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      company_id,
      sales_stage,
      lead_source,
      lead_source_detail,
      acquisition_cost,
      expected_contract_date,
      expected_mw,
      probability,
      value_estimate,
      owner_name
    } = req.body;

    if (!company_id || !sales_stage || !lead_source || !owner_name) {
      return res.status(400).json({
        error: 'Company ID, sales stage, lead source, and owner are required'
      });
    }

    // Check if company already has an active opportunity
    const existingResult = await client.query(
      'SELECT id FROM opportunities WHERE company_id = $1 AND status = $2',
      [company_id, 'Open']
    );

    if (existingResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Company already has an active opportunity'
      });
    }

    // Get company capacity as default expected_mw
    const companyResult = await client.query(
      'SELECT capacity_mw FROM companies WHERE id = $1',
      [company_id]
    );

    if (companyResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Company not found' });
    }

    const defaultMw = expected_mw || companyResult.rows[0].capacity_mw;
    const defaultProbability = probability || (DEFAULT_PROBABILITY as Record<string, number>)[sales_stage] || 10;

    // Create opportunity
    const opportunityResult = await client.query(
      `INSERT INTO opportunities (
        company_id, sales_stage, lead_source, lead_source_detail,
        acquisition_cost, expected_contract_date, expected_mw,
        probability, value_estimate, owner_name, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        company_id,
        sales_stage,
        lead_source,
        lead_source_detail,
        acquisition_cost,
        expected_contract_date,
        defaultMw,
        defaultProbability,
        value_estimate,
        owner_name,
        'Open'
      ]
    );

    // Create initial stage history entry
    await client.query(
      `INSERT INTO stage_history (opportunity_id, from_stage, to_stage, changed_by)
       VALUES ($1, NULL, $2, $3)`,
      [opportunityResult.rows[0].id, sales_stage, req.user?.name || owner_name]
    );

    await client.query('COMMIT');

    res.status(201).json(opportunityResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create opportunity error:', error);
    res.status(500).json({ error: 'Failed to create opportunity' });
  } finally {
    client.release();
  }
};

export const updateOpportunity = async (req: AuthRequest, res: Response)=> {
  try {
    const { id } = req.params;
    const {
      lead_source,
      lead_source_detail,
      acquisition_cost,
      expected_contract_date,
      expected_mw,
      probability,
      value_estimate,
      owner_name,
      status
    } = req.body;

    const result = await pool.query(
      `UPDATE opportunities
       SET lead_source = COALESCE($1, lead_source),
           lead_source_detail = COALESCE($2, lead_source_detail),
           acquisition_cost = COALESCE($3, acquisition_cost),
           expected_contract_date = COALESCE($4, expected_contract_date),
           expected_mw = COALESCE($5, expected_mw),
           probability = COALESCE($6, probability),
           value_estimate = COALESCE($7, value_estimate),
           owner_name = COALESCE($8, owner_name),
           status = COALESCE($9, status)
       WHERE id = $10
       RETURNING *`,
      [
        lead_source,
        lead_source_detail,
        acquisition_cost,
        expected_contract_date,
        expected_mw,
        probability,
        value_estimate,
        owner_name,
        status,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update opportunity error:', error);
    res.status(500).json({ error: 'Failed to update opportunity' });
  }
};

export const changeOpportunityStage = async (req: AuthRequest, res: Response)=> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { new_stage } = req.body;

    if (!new_stage) {
      return res.status(400).json({ error: 'New stage is required' });
    }

    // Get current stage
    const currentResult = await client.query(
      'SELECT sales_stage FROM opportunities WHERE id = $1',
      [id]
    );

    if (currentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    const currentStage = currentResult.rows[0].sales_stage;

    // Update opportunity stage
    const updateResult = await client.query(
      `UPDATE opportunities
       SET sales_stage = $1,
           stage_entered_at = CURRENT_TIMESTAMP,
           probability = COALESCE($2, probability)
       WHERE id = $3
       RETURNING *`,
      [new_stage, (DEFAULT_PROBABILITY as Record<string, number>)[new_stage], id]
    );

    // Log stage change in history
    await client.query(
      `INSERT INTO stage_history (opportunity_id, from_stage, to_stage, changed_by)
       VALUES ($1, $2, $3, $4)`,
      [id, currentStage, new_stage, req.user?.name || 'System']
    );

    await client.query('COMMIT');

    res.json(updateResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Change stage error:', error);
    res.status(500).json({ error: 'Failed to change stage' });
  } finally {
    client.release();
  }
};

export const addNote = async (req: AuthRequest, res: Response)=> {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Note content is required' });
    }

    const result = await pool.query(
      `INSERT INTO notes (opportunity_id, author_name, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, req.user?.name || 'Unknown', content]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ error: 'Failed to add note' });
  }
};

export const getOpportunityHistory = async (req: AuthRequest, res: Response)=> {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM stage_history WHERE opportunity_id = $1 ORDER BY changed_at ASC',
      [id]
    );

    res.json({ data: result.rows });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};
