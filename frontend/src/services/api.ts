import { supabase } from '../lib/supabase';
import type {
  User,
  Lead,
  LeadContact,
  LeadStageHistory,
  Activity,
  Task,
  DashboardSummary,
  PaginationInfo,
  CreateLeadRequest,
  CreateActivityRequest,
  CreateTaskRequest,
  LeadFilters,
  TaskFilters
} from '../types';

// =====================================================
// USER APIs
// =====================================================
export const userAPI = {
  getAll: async (): Promise<{ data: User[] }> => {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, region, is_active')
      .eq('is_active', true);

    if (error) throw error;
    return { data: data || [] };
  },

  getById: async (id: string): Promise<User> => {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, region')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },
};

// =====================================================
// LEAD APIs
// =====================================================
export const leadAPI = {
  getAll: async (params?: LeadFilters & { page?: number; limit?: number }): Promise<{ data: Lead[]; pagination: PaginationInfo }> => {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' });

    // Apply filters
    if (params?.lead_status) {
      query = query.eq('lead_status', params.lead_status);
    }
    if (params?.temperature) {
      query = query.eq('temperature', params.temperature);
    }
    if (params?.lead_grade) {
      query = query.eq('lead_grade', params.lead_grade);
    }
    if (params?.state) {
      query = query.eq('state', params.state);
    }
    if (params?.industry_sector) {
      query = query.eq('industry_sector', params.industry_sector);
    }
    if (params?.lead_source) {
      query = query.eq('lead_source', params.lead_source);
    }
    if (params?.assigned_to) {
      query = query.eq('assigned_to', params.assigned_to);
    }
    if (params?.search) {
      query = query.or(`company_name.ilike.%${params.search}%,city.ilike.%${params.search}%`);
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  },

  getById: async (id: string): Promise<{
    lead: Lead;
    contacts: LeadContact[];
    history: LeadStageHistory[];
    activities: Activity[];
    tasks: Task[];
  }> => {
    // Get lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (leadError) throw leadError;

    // Get contacts
    const { data: contacts } = await supabase
      .from('lead_contacts')
      .select('*')
      .eq('lead_id', id);

    // Get history
    const { data: history } = await supabase
      .from('lead_stage_history')
      .select('*')
      .eq('lead_id', id)
      .order('changed_at', { ascending: false });

    // Get activities
    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .eq('lead_id', id)
      .order('activity_date', { ascending: false });

    // Get tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('lead_id', id)
      .order('due_date', { ascending: true });

    return {
      lead,
      contacts: contacts || [],
      history: history || [],
      activities: activities || [],
      tasks: tasks || [],
    };
  },

  create: async (data: CreateLeadRequest): Promise<Lead> => {
    const { data: lead, error } = await supabase
      .from('leads')
      .insert([{
        ...data,
        lead_status: data.lead_status || 'New',
        temperature: data.temperature || 'Cold',
        lead_score: 0,
        lead_grade: 'C',
      }])
      .select()
      .single();

    if (error) throw error;
    return lead;
  },

  update: async (id: string, data: Partial<CreateLeadRequest>): Promise<Lead> => {
    const { data: lead, error } = await supabase
      .from('leads')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return lead;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  changeStatus: async (id: string, newStatus: string, notes?: string): Promise<Lead> => {
    // Get current status
    const { data: currentLead } = await supabase
      .from('leads')
      .select('lead_status')
      .eq('id', id)
      .single();

    // Update lead status
    const { data: lead, error } = await supabase
      .from('leads')
      .update({ lead_status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Add to history
    await supabase.from('lead_stage_history').insert([{
      lead_id: id,
      from_status: currentLead?.lead_status,
      to_status: newStatus,
      notes,
    }]);

    return lead;
  },

  assign: async (id: string, userId: string, _reason?: string): Promise<Lead> => {
    const { data: lead, error } = await supabase
      .from('leads')
      .update({ assigned_to: userId, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return lead;
  },

  // Contact management
  addContact: async (leadId: string, contact: Omit<LeadContact, 'id' | 'lead_id' | 'created_at'>): Promise<LeadContact> => {
    const { data, error } = await supabase
      .from('lead_contacts')
      .insert([{ ...contact, lead_id: leadId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteContact: async (_leadId: string, contactId: string): Promise<void> => {
    const { error } = await supabase
      .from('lead_contacts')
      .delete()
      .eq('id', contactId);

    if (error) throw error;
  },
};

// =====================================================
// ACTIVITY APIs
// =====================================================
export const activityAPI = {
  getAll: async (params?: { lead_id?: string; activity_type?: string; limit?: number }): Promise<{ data: Activity[] }> => {
    let query = supabase
      .from('activities')
      .select('*')
      .order('activity_date', { ascending: false });

    if (params?.lead_id) {
      query = query.eq('lead_id', params.lead_id);
    }
    if (params?.activity_type) {
      query = query.eq('activity_type', params.activity_type);
    }
    if (params?.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data: data || [] };
  },

  getByLead: async (leadId: string): Promise<{ data: Activity[] }> => {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('lead_id', leadId)
      .order('activity_date', { ascending: false });

    if (error) throw error;
    return { data: data || [] };
  },

  create: async (data: CreateActivityRequest): Promise<Activity> => {
    const { data: activity, error } = await supabase
      .from('activities')
      .insert([data])
      .select()
      .single();

    if (error) throw error;

    // Update last contact date on lead
    if (data.lead_id) {
      await supabase
        .from('leads')
        .update({ last_contact_date: new Date().toISOString().split('T')[0] })
        .eq('id', data.lead_id);
    }

    return activity;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// =====================================================
// TASK APIs
// =====================================================
export const taskAPI = {
  getAll: async (params?: TaskFilters): Promise<{ data: Task[] }> => {
    let query = supabase
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true });

    if (params?.status) {
      query = query.eq('status', params.status);
    }
    if (params?.priority) {
      query = query.eq('priority', params.priority);
    }
    if (params?.assigned_to) {
      query = query.eq('assigned_to', params.assigned_to);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data: data || [] };
  },

  getToday: async (): Promise<{ data: Task[] }> => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('due_date', today)
      .neq('status', 'completed')
      .order('priority', { ascending: true });

    if (error) throw error;
    return { data: data || [] };
  },

  getOverdue: async (): Promise<{ data: Task[] }> => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .lt('due_date', today)
      .neq('status', 'completed')
      .order('due_date', { ascending: true });

    if (error) throw error;
    return { data: data || [] };
  },

  getByLead: async (leadId: string): Promise<{ data: Task[] }> => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('lead_id', leadId)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return { data: data || [] };
  },

  create: async (data: CreateTaskRequest): Promise<Task> => {
    const { data: task, error } = await supabase
      .from('tasks')
      .insert([{ ...data, status: 'pending' }])
      .select()
      .single();

    if (error) throw error;
    return task;
  },

  update: async (id: string, data: Partial<CreateTaskRequest & { status?: string }>): Promise<Task> => {
    const { data: task, error } = await supabase
      .from('tasks')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return task;
  },

  complete: async (id: string): Promise<Task> => {
    const { data: task, error } = await supabase
      .from('tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return task;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// =====================================================
// DASHBOARD APIs
// =====================================================
export const dashboardAPI = {
  getSummary: async (): Promise<DashboardSummary> => {
    // Get lead counts by status
    const { data: leads } = await supabase
      .from('leads')
      .select('lead_status, temperature, deal_size_estimate, lead_score');

    const summary: DashboardSummary = {
      total_leads: leads?.length || 0,
      hot_leads: leads?.filter(l => l.temperature === 'Hot').length || 0,
      warm_leads: leads?.filter(l => l.temperature === 'Warm').length || 0,
      cold_leads: leads?.filter(l => l.temperature === 'Cold').length || 0,
      qualified_leads: leads?.filter(l => l.lead_status === 'Qualified').length || 0,
      pipeline_value: leads?.reduce((sum, l) => sum + (l.deal_size_estimate || 0), 0) || 0,
      avg_lead_score: leads?.length ? leads.reduce((sum, l) => sum + (l.lead_score || 0), 0) / leads.length : 0,
      won_deals: leads?.filter(l => l.lead_status === 'Won').length || 0,
      lost_deals: leads?.filter(l => l.lead_status === 'Lost').length || 0,
    };

    return summary;
  },

  getPipelineByStatus: async (): Promise<{ data: Array<{ lead_status: string; count: number; total_value: number; avg_score: number }> }> => {
    const { data: leads } = await supabase
      .from('leads')
      .select('lead_status, deal_size_estimate, lead_score');

    // Group by status
    const statusMap = new Map<string, { count: number; total_value: number; scores: number[] }>();

    leads?.forEach(lead => {
      const status = lead.lead_status || 'New';
      if (!statusMap.has(status)) {
        statusMap.set(status, { count: 0, total_value: 0, scores: [] });
      }
      const entry = statusMap.get(status)!;
      entry.count++;
      entry.total_value += lead.deal_size_estimate || 0;
      entry.scores.push(lead.lead_score || 0);
    });

    const result = Array.from(statusMap.entries()).map(([lead_status, data]) => ({
      lead_status,
      count: data.count,
      total_value: data.total_value,
      avg_score: data.scores.length ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length : 0,
    }));

    return { data: result };
  },

  getLeadSourceAnalytics: async (): Promise<{ data: Array<{ lead_source: string; total_leads: number; won: number; win_rate: number }> }> => {
    const { data: leads } = await supabase
      .from('leads')
      .select('lead_source, lead_status');

    // Group by source
    const sourceMap = new Map<string, { total: number; won: number }>();

    leads?.forEach(lead => {
      const source = lead.lead_source || 'Unknown';
      if (!sourceMap.has(source)) {
        sourceMap.set(source, { total: 0, won: 0 });
      }
      const entry = sourceMap.get(source)!;
      entry.total++;
      if (lead.lead_status === 'Won') {
        entry.won++;
      }
    });

    const result = Array.from(sourceMap.entries()).map(([lead_source, data]) => ({
      lead_source,
      total_leads: data.total,
      won: data.won,
      win_rate: data.total ? (data.won / data.total) * 100 : 0,
    }));

    return { data: result };
  },
};

// Legacy export for compatibility
export const authAPI = {
  login: async () => { throw new Error('Use AuthContext instead'); },
  getCurrentUser: async () => { throw new Error('Use AuthContext instead'); },
};

export default { leadAPI, activityAPI, taskAPI, dashboardAPI, userAPI };
