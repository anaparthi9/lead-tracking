import { PREMIUM_SECTORS, LeadGrade } from '../types';

/**
 * Lead Scoring Engine for Vyomaa Energy CRM
 *
 * Scoring Factors (Total: 100 points):
 * - Monthly Consumption: 25%
 * - Ownership Status: 20%
 * - Current Tariff: 15%
 * - Engagement Recency: 15%
 * - Sector Fit: 10%
 * - Existing Solar: 10%
 * - Deal Size: 5%
 */

export interface LeadScoringInput {
  monthly_consumption_kwh?: number;
  ownership_status?: string;
  lease_remaining_years?: number;
  current_tariff_per_kwh?: number;
  last_contact_date?: Date | string | null;
  industry_sector?: string;
  has_solar?: boolean;
  deal_size_estimate?: number;
}

export interface LeadScoringResult {
  score: number;
  grade: LeadGrade;
  breakdown: {
    consumption: number;
    ownership: number;
    tariff: number;
    engagement: number;
    sector: number;
    solar: number;
    dealSize: number;
  };
}

function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.floor(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
}

export function calculateLeadScore(input: LeadScoringInput): LeadScoringResult {
  const breakdown = {
    consumption: 0,
    ownership: 0,
    tariff: 0,
    engagement: 0,
    sector: 0,
    solar: 0,
    dealSize: 0
  };

  // 1. Monthly Consumption (25% weight, max 25 points)
  const consumption = input.monthly_consumption_kwh || 0;
  if (consumption > 50000) {
    breakdown.consumption = 25;
  } else if (consumption >= 20000) {
    breakdown.consumption = 17.5;
  } else if (consumption >= 10000) {
    breakdown.consumption = 12.5;
  } else {
    breakdown.consumption = 7.5;
  }

  // 2. Ownership Status (20% weight, max 20 points)
  const ownership = input.ownership_status;
  const leaseYears = input.lease_remaining_years || 0;
  if (ownership === 'Owned') {
    breakdown.ownership = 20;
  } else if (ownership === 'Leased' && leaseYears > 10) {
    breakdown.ownership = 14;
  } else if (ownership === 'Leased' && leaseYears > 5) {
    breakdown.ownership = 10;
  } else {
    breakdown.ownership = 6;
  }

  // 3. Current Tariff (15% weight, max 15 points)
  const tariff = input.current_tariff_per_kwh || 0;
  if (tariff > 9) {
    breakdown.tariff = 15;
  } else if (tariff >= 7) {
    breakdown.tariff = 10.5;
  } else if (tariff >= 5) {
    breakdown.tariff = 6;
  } else {
    breakdown.tariff = 3;
  }

  // 4. Engagement Recency (15% weight, max 15 points)
  let daysSinceContact = 999;
  if (input.last_contact_date) {
    const lastContact = typeof input.last_contact_date === 'string'
      ? new Date(input.last_contact_date)
      : input.last_contact_date;
    daysSinceContact = daysBetween(lastContact, new Date());
  }

  if (daysSinceContact < 7) {
    breakdown.engagement = 15;
  } else if (daysSinceContact < 14) {
    breakdown.engagement = 10.5;
  } else if (daysSinceContact < 30) {
    breakdown.engagement = 6;
  } else {
    breakdown.engagement = 3;
  }

  // 5. Sector Fit (10% weight, max 10 points)
  const sector = input.industry_sector || '';
  if (PREMIUM_SECTORS.includes(sector)) {
    breakdown.sector = 10;
  } else {
    breakdown.sector = 6;
  }

  // 6. Existing Solar (10% weight, max 10 points)
  // Having solar indicates expansion/BESS upsell opportunity
  if (input.has_solar) {
    breakdown.solar = 8; // Expansion/BESS opportunity
  } else {
    breakdown.solar = 5; // New installation opportunity
  }

  // 7. Deal Size (5% weight, max 5 points)
  const dealSize = input.deal_size_estimate || 0;
  if (dealSize > 10000000) { // > 1 Crore
    breakdown.dealSize = 5;
  } else if (dealSize > 5000000) { // > 50 Lakh
    breakdown.dealSize = 3.5;
  } else if (dealSize > 1000000) { // > 10 Lakh
    breakdown.dealSize = 2;
  } else {
    breakdown.dealSize = 1;
  }

  // Calculate total score
  const score = Math.round(
    breakdown.consumption +
    breakdown.ownership +
    breakdown.tariff +
    breakdown.engagement +
    breakdown.sector +
    breakdown.solar +
    breakdown.dealSize
  );

  // Determine grade
  let grade: LeadGrade;
  if (score >= 80) {
    grade = LeadGrade.A;
  } else if (score >= 60) {
    grade = LeadGrade.B;
  } else if (score >= 40) {
    grade = LeadGrade.C;
  } else {
    grade = LeadGrade.D;
  }

  return { score, grade, breakdown };
}

/**
 * Check for potential duplicate leads
 * Returns true if a potential duplicate is found
 */
export async function checkDuplicateLead(
  pool: any,
  companyName: string,
  email?: string,
  phone?: string,
  excludeLeadId?: string
): Promise<{ isDuplicate: boolean; duplicateId?: string; matchReason?: string }> {
  let query = `
    SELECT DISTINCT l.id, l.company_name
    FROM leads l
    LEFT JOIN lead_contacts lc ON lc.lead_id = l.id
    LEFT JOIN contact_emails ce ON ce.contact_id = lc.id
    LEFT JOIN contact_phones cp ON cp.contact_id = lc.id
    WHERE 1=1
  `;
  const params: any[] = [];
  const conditions: string[] = [];

  // Check company name similarity (case-insensitive)
  params.push(`%${companyName.toLowerCase()}%`);
  conditions.push(`LOWER(l.company_name) LIKE $${params.length}`);

  // Check email match
  if (email) {
    params.push(email.toLowerCase());
    conditions.push(`LOWER(ce.email) = $${params.length}`);
  }

  // Check phone match
  if (phone) {
    // Remove non-numeric characters for comparison
    const cleanPhone = phone.replace(/\D/g, '');
    params.push(`%${cleanPhone.slice(-10)}%`); // Last 10 digits
    conditions.push(`cp.phone LIKE $${params.length}`);
  }

  query += ` AND (${conditions.join(' OR ')})`;

  // Exclude current lead if updating
  if (excludeLeadId) {
    params.push(excludeLeadId);
    query += ` AND l.id != $${params.length}`;
  }

  query += ' LIMIT 1';

  const result = await pool.query(query, params);

  if (result.rows.length > 0) {
    return {
      isDuplicate: true,
      duplicateId: result.rows[0].id,
      matchReason: `Similar to existing lead: ${result.rows[0].company_name}`
    };
  }

  return { isDuplicate: false };
}
