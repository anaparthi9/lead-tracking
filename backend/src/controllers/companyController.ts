import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';

export const getCompanies = async (req: AuthRequest, res: Response)=> {
  try {
    const {
      page = '1',
      limit = '50',
      search = '',
      status,
      model,
      industry,
      location,
      minCapacity,
      maxCapacity
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let query = `
      SELECT
        c.*,
        o.id as opportunity_id,
        o.sales_stage,
        o.lead_source,
        o.status as opportunity_status
      FROM companies c
      LEFT JOIN opportunities o ON c.id = o.company_id AND o.status = 'Open'
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (
        c.name ILIKE $${paramCount} OR
        c.industry ILIKE $${paramCount} OR
        c.location ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (status) {
      query += ` AND c.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (model) {
      query += ` AND c.model = $${paramCount}`;
      params.push(model);
      paramCount++;
    }

    if (industry) {
      query += ` AND c.industry ILIKE $${paramCount}`;
      params.push(`%${industry}%`);
      paramCount++;
    }

    if (location) {
      query += ` AND c.location ILIKE $${paramCount}`;
      params.push(`%${location}%`);
      paramCount++;
    }

    if (minCapacity) {
      query += ` AND c.capacity_mw >= $${paramCount}`;
      params.push(parseFloat(minCapacity as string));
      paramCount++;
    }

    if (maxCapacity) {
      query += ` AND c.capacity_mw <= $${paramCount}`;
      params.push(parseFloat(maxCapacity as string));
      paramCount++;
    }

    // Get total count
    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(DISTINCT c.id) FROM');
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Add pagination
    query += ` ORDER BY c.sr_no, c.id LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit as string), offset);

    const result = await pool.query(query, params);

    res.json({
      data: result.rows,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
};

export const getCompanyById = async (req: AuthRequest, res: Response)=> {
  try {
    const { id } = req.params;

    const companyResult = await pool.query(
      'SELECT * FROM companies WHERE id = $1',
      [id]
    );

    if (companyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Get active opportunity
    const opportunityResult = await pool.query(
      'SELECT * FROM opportunities WHERE company_id = $1 AND status = $2',
      [id, 'Open']
    );

    // Get past opportunities
    const pastOpportunitiesResult = await pool.query(
      'SELECT * FROM opportunities WHERE company_id = $1 AND status != $2 ORDER BY updated_at DESC',
      [id, 'Open']
    );

    res.json({
      company: companyResult.rows[0],
      activeOpportunity: opportunityResult.rows[0] || null,
      pastOpportunities: pastOpportunitiesResult.rows
    });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ error: 'Failed to fetch company' });
  }
};

export const createCompany = async (req: AuthRequest, res: Response)=> {
  try {
    const {
      sr_no,
      name,
      industry,
      location,
      re_consumption,
      capacity_mw,
      status,
      model
    } = req.body;

    if (!name || !status) {
      return res.status(400).json({ error: 'Name and status are required' });
    }

    const result = await pool.query(
      `INSERT INTO companies (sr_no, name, industry, location, re_consumption, capacity_mw, status, model)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [sr_no, name, industry, location, re_consumption, capacity_mw, status, model]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ error: 'Failed to create company' });
  }
};

export const updateCompany = async (req: AuthRequest, res: Response)=> {
  try {
    const { id } = req.params;
    const {
      sr_no,
      name,
      industry,
      location,
      re_consumption,
      capacity_mw,
      status,
      model
    } = req.body;

    const result = await pool.query(
      `UPDATE companies
       SET sr_no = COALESCE($1, sr_no),
           name = COALESCE($2, name),
           industry = COALESCE($3, industry),
           location = COALESCE($4, location),
           re_consumption = COALESCE($5, re_consumption),
           capacity_mw = COALESCE($6, capacity_mw),
           status = COALESCE($7, status),
           model = COALESCE($8, model)
       WHERE id = $9
       RETURNING *`,
      [sr_no, name, industry, location, re_consumption, capacity_mw, status, model, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ error: 'Failed to update company' });
  }
};

export const deleteCompany = async (req: AuthRequest, res: Response)=> {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM companies WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ error: 'Failed to delete company' });
  }
};

export const getCompanyFilters = async (_req: AuthRequest, res: Response)=> {
  try {
    const industryResult = await pool.query(
      'SELECT DISTINCT industry FROM companies WHERE industry IS NOT NULL ORDER BY industry'
    );

    const locationResult = await pool.query(
      'SELECT DISTINCT location FROM companies WHERE location IS NOT NULL ORDER BY location'
    );

    res.json({
      industries: industryResult.rows.map(r => r.industry),
      locations: locationResult.rows.map(r => r.location)
    });
  } catch (error) {
    console.error('Get filters error:', error);
    res.status(500).json({ error: 'Failed to fetch filters' });
  }
};
