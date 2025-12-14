// =====================================================
// VYOMAA ENERGY CRM - TYPE DEFINITIONS
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

export enum TemplateCategory {
  FIRST_OUTREACH = 'first_outreach',
  FOLLOW_UP = 'follow_up',
  PROPOSAL_INTRO = 'proposal_intro',
  NEGOTIATION = 'negotiation'
}

// Lead Sources
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

// Industry Sectors
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

// Loss Reasons
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

export type LossReason = typeof LOSS_REASONS[number];

// =====================================================
// INTERFACES
// =====================================================

// User
export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  region?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  region?: string;
  is_active: boolean;
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
  lead_source?: string;
  lead_source_detail?: string;
  last_contact_date?: Date;
  next_action_date?: Date;
  deal_size_estimate?: number;
  preferred_model?: PreferredModel;
  // Loss tracking
  loss_reason?: string;
  loss_notes?: string;
  // Duplicate detection
  is_duplicate_flag: boolean;
  duplicate_of?: string;
  // Metadata
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

// Lead with relations
export interface LeadWithContacts extends Lead {
  contacts: LeadContact[];
  assigned_user?: UserDTO;
}

// Lead Contact
export interface LeadContact {
  id: string;
  lead_id: string;
  name: string;
  designation?: string;
  is_primary: boolean;
  emails: ContactEmail[];
  phones: ContactPhone[];
  created_at: Date;
}

export interface ContactEmail {
  id: string;
  contact_id: string;
  email: string;
  is_primary: boolean;
}

export interface ContactPhone {
  id: string;
  contact_id: string;
  phone: string;
  phone_type?: PhoneType;
  is_primary: boolean;
}

// Lead Stage History
export interface LeadStageHistory {
  id: string;
  lead_id: string;
  from_status?: LeadStatus;
  to_status: LeadStatus;
  changed_by?: string;
  changed_at: Date;
  notes?: string;
}

// Lead Assignment History
export interface LeadAssignmentHistory {
  id: string;
  lead_id: string;
  from_user?: string;
  to_user?: string;
  assigned_by?: string;
  assigned_at: Date;
  reason?: string;
}

// Activity / Communication Log
export interface Activity {
  id: string;
  lead_id?: string;
  tender_id?: string;
  activity_type: ActivityType;
  activity_date: Date;
  duration_minutes?: number;
  subject?: string;
  outcome?: string;
  notes?: string;
  attendees?: string[];
  action_items?: string[];
  created_by?: string;
  created_at: Date;
}

export interface ActivityWithAttachments extends Activity {
  attachments: ActivityAttachment[];
  lead?: Lead;
  created_by_user?: UserDTO;
}

// Activity Attachment
export interface ActivityAttachment {
  id: string;
  activity_id: string;
  file_name: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  uploaded_at: Date;
}

// Task
export interface Task {
  id: string;
  lead_id?: string;
  tender_id?: string;
  task_type: TaskType;
  title: string;
  description?: string;
  due_date: Date;
  due_time?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_to?: string;
  completed_at?: Date;
  completed_by?: string;
  auto_generated: boolean;
  trigger_rule?: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface TaskWithRelations extends Task {
  lead?: Lead;
  assigned_user?: UserDTO;
}

// Communication Template
export interface CommunicationTemplate {
  id: string;
  name: string;
  category?: TemplateCategory;
  subject?: string;
  content: string;
  is_active: boolean;
  created_by?: string;
  created_at: Date;
}

// Notification
export interface Notification {
  id: string;
  user_id?: string;
  notification_type: string;
  title: string;
  message?: string;
  entity_type?: string;
  entity_id?: string;
  is_read: boolean;
  created_at: Date;
}

// =====================================================
// REQUEST/RESPONSE TYPES
// =====================================================

// Lead Create/Update Request
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
  assigned_to?: string;
  contacts?: CreateContactRequest[];
}

export interface CreateContactRequest {
  name: string;
  designation?: string;
  is_primary?: boolean;
  emails?: { email: string; is_primary?: boolean }[];
  phones?: { phone: string; phone_type?: PhoneType; is_primary?: boolean }[];
}

// Activity Create Request
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

// Task Create Request
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

export interface LeadSourceAnalytics {
  lead_source: string;
  total_leads: number;
  won: number;
  lost: number;
  win_rate: number;
}

// =====================================================
// LEAD SCORING CONSTANTS
// =====================================================

export const LEAD_STATUS_ORDER = [
  LeadStatus.NEW,
  LeadStatus.QUALIFIED,
  LeadStatus.SITE_SURVEY,
  LeadStatus.PROPOSAL,
  LeadStatus.NEGOTIATION,
  LeadStatus.WON
];

export const DEFAULT_PROBABILITY: Record<LeadStatus, number> = {
  [LeadStatus.NEW]: 10,
  [LeadStatus.QUALIFIED]: 20,
  [LeadStatus.SITE_SURVEY]: 40,
  [LeadStatus.PROPOSAL]: 50,
  [LeadStatus.NEGOTIATION]: 75,
  [LeadStatus.WON]: 100,
  [LeadStatus.LOST]: 0
};

// Premium sectors for lead scoring
export const PREMIUM_SECTORS = [
  'Pharmaceutical',
  'IT/ITES',
  'Healthcare',
  'Manufacturing'
];
