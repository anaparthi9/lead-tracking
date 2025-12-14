// =====================================================
// VYOMAA ENERGY CRM - FRONTEND TYPE DEFINITIONS
// =====================================================

// Enums for Lead Management
export enum LeadStatus {
  NEW = 'New',
  QUALIFIED = 'Qualified',
  SITE_SURVEY = 'Site Survey',
  PROPOSAL = 'Proposal',
  NEGOTIATION = 'Negotiation',
  WON = 'Won',
  LOST = 'Lost'
}

export enum LeadTemperature {
  COLD = 'Cold',
  WARM = 'Warm',
  HOT = 'Hot'
}

export enum LeadGrade {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D'
}

export enum RoofType {
  RCC = 'RCC',
  METAL_SHEET = 'Metal sheet',
  GROUND_MOUNT = 'Ground mount',
  MIXED = 'Mixed'
}

export enum OwnershipStatus {
  OWNED = 'Owned',
  LEASED = 'Leased',
  RENTED = 'Rented'
}

export enum PreferredModel {
  CAPEX = 'CAPEX',
  OPEX = 'OPEX',
  SALE_LEASEBACK = 'Sale-Leaseback',
  UNDECIDED = 'Undecided'
}

export enum ActivityType {
  PHONE_CALL = 'phone_call',
  EMAIL_SENT = 'email_sent',
  WHATSAPP = 'whatsapp',
  MEETING = 'meeting',
  SITE_VISIT = 'site_visit'
}

export enum TaskType {
  FOLLOW_UP_CALL = 'follow_up_call',
  FOLLOW_UP_EMAIL = 'follow_up_email',
  SITE_VISIT = 'site_visit',
  SEND_PROPOSAL = 'send_proposal',
  PROPOSAL_FOLLOW_UP = 'proposal_follow_up',
  DOCUMENT_COLLECTION = 'document_collection',
  INTERNAL_REVIEW = 'internal_review',
  CONTRACT_NEGOTIATION = 'contract_negotiation',
  HANDOFF_TO_PROJECTS = 'handoff_to_projects',
  CUSTOM = 'custom'
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum PhoneType {
  MOBILE = 'mobile',
  LANDLINE = 'landline',
  WHATSAPP = 'whatsapp'
}

export enum UserRole {
  ADMIN = 'admin',
  SALES_REP = 'sales_rep'
}

// Constants
export const LEAD_SOURCES = [
  'MERCOM',
  'IndiaSolar',
  'Website',
  'Referral',
  'Cold Outreach',
  'Tender Portal',
  'Existing Customer',
  'Conference/Event',
  'Other'
] as const;

export type LeadSource = typeof LEAD_SOURCES[number];

export const INDUSTRY_SECTORS = [
  'Manufacturing',
  'Healthcare',
  'Education',
  'Hospitality',
  'IT/ITES',
  'Pharmaceutical',
  'Automotive',
  'Textile',
  'Food & Beverage',
  'Retail',
  'Logistics',
  'Real Estate',
  'Government',
  'Other'
] as const;

export type IndustrySector = typeof INDUSTRY_SECTORS[number];

export const LOSS_REASONS = [
  'Price',
  'Competition',
  'Timing',
  'Internal Decision',
  'Technical',
  'Financing',
  'Regulatory',
  'No Response',
  'Other'
] as const;

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Chandigarh',
  'Puducherry'
] as const;

export const LEAD_STATUS_ORDER = [
  LeadStatus.NEW,
  LeadStatus.QUALIFIED,
  LeadStatus.SITE_SURVEY,
  LeadStatus.PROPOSAL,
  LeadStatus.NEGOTIATION,
  LeadStatus.WON
];

// =====================================================
// INTERFACES
// =====================================================

// User
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  region?: string;
  is_active?: boolean;
}

// Contact Email
export interface ContactEmail {
  id?: string;
  contact_id?: string;
  email: string;
  is_primary: boolean;
}

// Contact Phone
export interface ContactPhone {
  id?: string;
  contact_id?: string;
  phone: string;
  phone_type?: PhoneType;
  is_primary: boolean;
}

// Lead Contact
export interface LeadContact {
  id?: string;
  lead_id?: string;
  name: string;
  designation?: string;
  is_primary: boolean;
  emails: ContactEmail[];
  phones: ContactPhone[];
  created_at?: string;
}

// Lead
export interface Lead {
  id: string;
  // Contact Information
  company_name: string;
  gstin?: string;
  website_url?: string;
  // Address
  address_full?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  // Qualification Data
  industry_sector?: string;
  sanctioned_load_kva?: number;
  monthly_consumption_kwh?: number;
  current_tariff_per_kwh?: number;
  // Current Infrastructure
  has_solar: boolean;
  solar_capacity_kw?: number;
  has_battery: boolean;
  battery_capacity_kwh?: number;
  has_dg: boolean;
  dg_capacity_kva?: number;
  // Roof/Site
  roof_type?: RoofType;
  available_area_sqft?: number;
  ownership_status?: OwnershipStatus;
  lease_remaining_years?: number;
  // Sales Process
  lead_score: number;
  lead_grade?: LeadGrade;
  lead_status: LeadStatus;
  temperature: LeadTemperature;
  assigned_to?: string;
  assigned_user_name?: string;
  lead_source?: string;
  lead_source_detail?: string;
  last_contact_date?: string;
  next_action_date?: string;
  deal_size_estimate?: number;
  preferred_model?: PreferredModel;
  // Loss tracking
  loss_reason?: string;
  loss_notes?: string;
  // Duplicate detection
  is_duplicate_flag: boolean;
  duplicate_of?: string;
  // Contacts (when loaded)
  contacts?: LeadContact[];
  // Metadata
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Lead Stage History
export interface LeadStageHistory {
  id: string;
  lead_id: string;
  from_status?: LeadStatus;
  to_status: LeadStatus;
  changed_by?: string;
  changed_by_name?: string;
  changed_at: string;
  notes?: string;
}

// Activity / Communication Log
export interface Activity {
  id: string;
  lead_id?: string;
  lead_company_name?: string;
  tender_id?: string;
  activity_type: ActivityType;
  activity_date: string;
  duration_minutes?: number;
  subject?: string;
  outcome?: string;
  notes?: string;
  attendees?: string[];
  action_items?: string[];
  created_by?: string;
  created_by_name?: string;
  created_at: string;
}

// Task
export interface Task {
  id: string;
  lead_id?: string;
  lead_company_name?: string;
  tender_id?: string;
  task_type: TaskType;
  title: string;
  description?: string;
  due_date: string;
  due_time?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_to?: string;
  assigned_user_name?: string;
  completed_at?: string;
  completed_by?: string;
  auto_generated: boolean;
  trigger_rule?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// REQUEST TYPES
// =====================================================

export interface CreateLeadRequest {
  company_name: string;
  gstin?: string;
  website_url?: string;
  address_full?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  industry_sector?: string;
  sanctioned_load_kva?: number;
  monthly_consumption_kwh?: number;
  current_tariff_per_kwh?: number;
  has_solar?: boolean;
  solar_capacity_kw?: number;
  has_battery?: boolean;
  battery_capacity_kwh?: number;
  has_dg?: boolean;
  dg_capacity_kva?: number;
  roof_type?: RoofType;
  available_area_sqft?: number;
  ownership_status?: OwnershipStatus;
  lease_remaining_years?: number;
  lead_source?: string;
  lead_source_detail?: string;
  deal_size_estimate?: number;
  preferred_model?: PreferredModel;
  temperature?: LeadTemperature;
  lead_status?: LeadStatus;
  assigned_to?: string;
  contacts?: Omit<LeadContact, 'id' | 'lead_id' | 'created_at'>[];
}

export interface CreateActivityRequest {
  lead_id?: string;
  tender_id?: string;
  activity_type: ActivityType;
  activity_date: string;
  duration_minutes?: number;
  subject?: string;
  outcome?: string;
  notes?: string;
  attendees?: string[];
  action_items?: string[];
}

export interface CreateTaskRequest {
  lead_id?: string;
  tender_id?: string;
  task_type: TaskType;
  title: string;
  description?: string;
  due_date: string;
  due_time?: string;
  priority?: TaskPriority;
  assigned_to?: string;
}

// =====================================================
// ANALYTICS TYPES
// =====================================================

export interface DashboardSummary {
  total_leads: number;
  hot_leads: number;
  warm_leads: number;
  cold_leads: number;
  qualified_leads: number;
  pipeline_value: number;
  avg_lead_score: number;
  won_deals: number;
  lost_deals: number;
}

export interface PipelineSummary {
  lead_status: LeadStatus;
  count: number;
  total_value: number;
  avg_score: number;
}

export interface SalesRepPerformance {
  id: string;
  name: string;
  region?: string;
  total_leads: number;
  won_deals: number;
  won_value: number;
  active_pipeline: number;
  pipeline_value: number;
}

// =====================================================
// PAGINATION
// =====================================================

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// =====================================================
// FILTER TYPES
// =====================================================

export interface LeadFilters {
  lead_status?: LeadStatus;
  temperature?: LeadTemperature;
  lead_grade?: LeadGrade;
  industry_sector?: string;
  state?: string;
  lead_source?: string;
  preferred_model?: PreferredModel;
  assigned_to?: string;
  has_solar?: boolean;
  search?: string;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigned_to?: string;
  lead_id?: string;
  overdue?: boolean;
  today?: boolean;
}
