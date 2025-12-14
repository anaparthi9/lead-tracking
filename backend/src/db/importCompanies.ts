import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import pool from '../config/database';

interface CompanyRow {
  'Sr No': string;
  'Company Name': string;
  'Industry': string;
  'Location': string;
  'RE Consumption': string;
  'Capacity (MW)': string;
  'Status': string;
  'Model': string;
  [key: string]: string; // Allow indexing with any string key
}

const importCompaniesFromCSV = async (filePath: string) => {
  const client = await pool.connect();

  try {
    console.log('📂 Reading CSV file:', filePath);

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const companies: any[] = [];

    // Read and parse CSV
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row: CompanyRow) => {
          companies.push({
            sr_no: row['Sr No'] ? parseInt(row['Sr No']) : null,
            name: row['Company Name'] || row['name'] || '',
            industry: row['Industry'] || row['industry'] || '',
            location: row['Location'] || row['location'] || '',
            re_consumption: row['RE Consumption'] || row['re_consumption'] || null,
            capacity_mw: row['Capacity (MW)'] ? parseFloat(row['Capacity (MW)']) : null,
            status: row['Status'] || row['status'] || 'Active',
            model: row['Model'] || row['model'] || null
          });
        })
        .on('end', () => {
          console.log(`✓ Parsed ${companies.length} companies from CSV`);
          resolve();
        })
        .on('error', (error) => {
          reject(error);
        });
    });

    if (companies.length === 0) {
      console.log('⚠️  No companies found in CSV file');
      return;
    }

    console.log('💾 Importing companies to database...');

    let imported = 0;
    let errors = 0;

    for (const company of companies) {
      try {
        if (!company.name) {
          console.log(`⚠️  Skipping row with no company name`);
          errors++;
          continue;
        }

        await client.query(
          `INSERT INTO companies (sr_no, name, industry, location, re_consumption, capacity_mw, status, model)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT DO NOTHING`,
          [
            company.sr_no,
            company.name,
            company.industry,
            company.location,
            company.re_consumption,
            company.capacity_mw,
            company.status,
            company.model
          ]
        );

        imported++;

        if (imported % 50 === 0) {
          console.log(`  Imported ${imported}/${companies.length}...`);
        }
      } catch (error: any) {
        console.error(`❌ Error importing company "${company.name}":`, error.message);
        errors++;
      }
    }

    console.log('\n✅ Import completed!');
    console.log(`  Successfully imported: ${imported}`);
    console.log(`  Errors: ${errors}`);
    console.log(`  Total: ${companies.length}`);
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run import if this file is executed directly
if (require.main === module) {
  const csvPath = process.argv[2] || path.join(__dirname, '../../companies.csv');

  console.log('🚀 Starting company import...');
  console.log('CSV file path:', csvPath);

  importCompaniesFromCSV(csvPath)
    .then(() => {
      console.log('\n✨ Import complete. Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Import error:', error);
      process.exit(1);
    });
}

export default importCompaniesFromCSV;
