import pool from '../config/database';

const createTables = async () => {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting database migration...');

    // Drop existing tables if needed (for development)
    await client.query(`
      DROP TABLE IF EXISTS notes CASCADE;
      DROP TABLE IF EXISTS stage_history CASCADE;
      DROP TABLE IF EXISTS opportunities CASCADE;
      DROP TABLE IF EXISTS companies CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    console.log('✓ Dropped existing tables');

    // Create users table
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✓ Created users table');

    // Create companies table
    await client.query(`
      CREATE TABLE companies (
        id SERIAL PRIMARY KEY,
        sr_no INTEGER,
        name VARCHAR(255) NOT NULL,
        industry VARCHAR(255),
        location VARCHAR(255),
        re_consumption VARCHAR(255),
        capacity_mw DECIMAL(10, 2),
        status VARCHAR(50) NOT NULL DEFAULT 'Active',
        model VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_status CHECK (status IN ('Active', 'Inactive')),
        CONSTRAINT chk_model CHECK (model IN ('EPC', 'RESCO', 'OPEX', 'CAPEX', 'Other') OR model IS NULL)
      );
    `);

    console.log('✓ Created companies table');

    // Create index on company name for faster searches
    await client.query(`
      CREATE INDEX idx_companies_name ON companies(name);
      CREATE INDEX idx_companies_status ON companies(status);
      CREATE INDEX idx_companies_location ON companies(location);
      CREATE INDEX idx_companies_industry ON companies(industry);
    `);

    console.log('✓ Created indexes on companies table');

    // Create opportunities table
    await client.query(`
      CREATE TABLE opportunities (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        sales_stage VARCHAR(100) NOT NULL,
        lead_source VARCHAR(100) NOT NULL,
        lead_source_detail TEXT,
        acquisition_cost DECIMAL(15, 2),
        stage_entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expected_contract_date DATE,
        expected_mw DECIMAL(10, 2),
        probability INTEGER DEFAULT 10 CHECK (probability >= 0 AND probability <= 100),
        value_estimate DECIMAL(15, 2),
        owner_name VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_opportunity_status CHECK (status IN ('Open', 'Won', 'Lost', 'On Hold')),
        CONSTRAINT chk_sales_stage CHECK (sales_stage IN (
          'Lead Qualified',
          'Pre-Feasibility',
          'Site Survey',
          'Technical Feasibility Report',
          'Business Case & ROI',
          'Commercial Alignment',
          'Proposal Issued',
          'Negotiation & Compliance',
          'Documentation & Signing'
        )),
        CONSTRAINT chk_lead_source CHECK (lead_source IN (
          'Tender / RFP',
          'MERCOM / Conference',
          'Existing Customer',
          'Referrals & Partners',
          'Other'
        ))
      );
    `);

    console.log('✓ Created opportunities table');

    // Create indexes for opportunities
    await client.query(`
      CREATE INDEX idx_opportunities_company ON opportunities(company_id);
      CREATE INDEX idx_opportunities_status ON opportunities(status);
      CREATE INDEX idx_opportunities_stage ON opportunities(sales_stage);
      CREATE INDEX idx_opportunities_source ON opportunities(lead_source);
      CREATE INDEX idx_opportunities_owner ON opportunities(owner_name);
    `);

    console.log('✓ Created indexes on opportunities table');

    // Create stage_history table
    await client.query(`
      CREATE TABLE stage_history (
        id SERIAL PRIMARY KEY,
        opportunity_id INTEGER NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
        from_stage VARCHAR(100),
        to_stage VARCHAR(100) NOT NULL,
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        changed_by VARCHAR(255) NOT NULL,
        CONSTRAINT chk_from_stage CHECK (from_stage IN (
          'Lead Qualified',
          'Pre-Feasibility',
          'Site Survey',
          'Technical Feasibility Report',
          'Business Case & ROI',
          'Commercial Alignment',
          'Proposal Issued',
          'Negotiation & Compliance',
          'Documentation & Signing'
        ) OR from_stage IS NULL),
        CONSTRAINT chk_to_stage CHECK (to_stage IN (
          'Lead Qualified',
          'Pre-Feasibility',
          'Site Survey',
          'Technical Feasibility Report',
          'Business Case & ROI',
          'Commercial Alignment',
          'Proposal Issued',
          'Negotiation & Compliance',
          'Documentation & Signing'
        ))
      );
    `);

    console.log('✓ Created stage_history table');

    // Create index for stage history
    await client.query(`
      CREATE INDEX idx_stage_history_opportunity ON stage_history(opportunity_id);
      CREATE INDEX idx_stage_history_changed_at ON stage_history(changed_at);
    `);

    console.log('✓ Created indexes on stage_history table');

    // Create notes table
    await client.query(`
      CREATE TABLE notes (
        id SERIAL PRIMARY KEY,
        opportunity_id INTEGER NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
        author_name VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✓ Created notes table');

    // Create index for notes
    await client.query(`
      CREATE INDEX idx_notes_opportunity ON notes(opportunity_id);
      CREATE INDEX idx_notes_created_at ON notes(created_at);
    `);

    console.log('✓ Created indexes on notes table');

    // Create trigger to update updated_at timestamp
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      CREATE TRIGGER update_companies_updated_at
        BEFORE UPDATE ON companies
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      CREATE TRIGGER update_opportunities_updated_at
        BEFORE UPDATE ON opportunities
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✓ Created triggers for timestamp updates');

    console.log('✅ Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  createTables()
    .then(() => {
      console.log('Migration complete. Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration error:', error);
      process.exit(1);
    });
}

export default createTables;
