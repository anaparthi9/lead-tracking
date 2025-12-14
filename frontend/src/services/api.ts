import axios from 'axios';
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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// =====================================================
// AUTH APIs
// =====================================================
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  getCurrentUser: async (): Promise<{ user: User }> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// =====================================================
// USER APIs
// =====================================================
export const userAPI = {
  getAll: async (): Promise<{ data: User[] }> => {
    const response = await api.get('/users');
    return response.data;
  },
  getById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  create: async (data: { email: string; password: string; name: string; role?: string; region?: string }): Promise<User> => {
    const response = await api.post('/users', data);
    return response.data;
  },
  update: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
};

// =====================================================
// LEAD APIs
// =====================================================
export const leadAPI = {
  getAll: async (params?: LeadFilters & { page?: number; limit?: number }): Promise<{ data: Lead[]; pagination: PaginationInfo }> => {
    const response = await api.get('/leads', { params });
    return response.data;
  },

  getById: async (id: string): Promise<{
    lead: Lead;
    contacts: LeadContact[];
    history: LeadStageHistory[];
    activities: Activity[];
    tasks: Task[];
  }> => {
    const response = await api.get(`/leads/${id}`);
    return response.data;
  },

  create: async (data: CreateLeadRequest): Promise<Lead> => {
    const response = await api.post('/leads', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateLeadRequest>): Promise<Lead> => {
    const response = await api.put(`/leads/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/leads/${id}`);
  },

  changeStatus: async (id: string, newStatus: string, notes?: string): Promise<Lead> => {
    const response = await api.put(`/leads/${id}/status`, { new_status: newStatus, notes });
    return response.data;
  },

  assign: async (id: string, userId: string, reason?: string): Promise<Lead> => {
    const response = await api.put(`/leads/${id}/assign`, { assigned_to: userId, reason });
    return response.data;
  },

  recalculateScore: async (id: string): Promise<{ lead_score: number; lead_grade: string }> => {
    const response = await api.get(`/leads/${id}/score`);
    return response.data;
  },

  // Contact management
  addContact: async (leadId: string, contact: Omit<LeadContact, 'id' | 'lead_id' | 'created_at'>): Promise<LeadContact> => {
    const response = await api.post(`/leads/${leadId}/contacts`, contact);
    return response.data;
  },

  updateContact: async (leadId: string, contactId: string, contact: Partial<LeadContact>): Promise<LeadContact> => {
    const response = await api.put(`/leads/${leadId}/contacts/${contactId}`, contact);
    return response.data;
  },

  deleteContact: async (leadId: string, contactId: string): Promise<void> => {
    await api.delete(`/leads/${leadId}/contacts/${contactId}`);
  },

  // Bulk import
  import: async (file: File): Promise<{ imported: number; errors: string[] }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/leads/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Get filters options
  getFilters: async (): Promise<{
    industries: string[];
    states: string[];
    sources: string[];
    users: { id: string; name: string }[];
  }> => {
    const response = await api.get('/leads/filters');
    return response.data;
  },
};

// =====================================================
// ACTIVITY APIs
// =====================================================
export const activityAPI = {
  getAll: async (params?: { lead_id?: string; activity_type?: string; limit?: number }): Promise<{ data: Activity[] }> => {
    const response = await api.get('/activities', { params });
    return response.data;
  },

  getByLead: async (leadId: string): Promise<{ data: Activity[] }> => {
    const response = await api.get(`/activities/lead/${leadId}`);
    return response.data;
  },

  create: async (data: CreateActivityRequest): Promise<Activity> => {
    const response = await api.post('/activities', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateActivityRequest>): Promise<Activity> => {
    const response = await api.put(`/activities/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/activities/${id}`);
  },
};

// =====================================================
// TASK APIs
// =====================================================
export const taskAPI = {
  getAll: async (params?: TaskFilters): Promise<{ data: Task[] }> => {
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  getToday: async (): Promise<{ data: Task[] }> => {
    const response = await api.get('/tasks/today');
    return response.data;
  },

  getOverdue: async (): Promise<{ data: Task[] }> => {
    const response = await api.get('/tasks/overdue');
    return response.data;
  },

  getByLead: async (leadId: string): Promise<{ data: Task[] }> => {
    const response = await api.get(`/tasks/lead/${leadId}`);
    return response.data;
  },

  create: async (data: CreateTaskRequest): Promise<Task> => {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateTaskRequest & { status?: string }>): Promise<Task> => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },

  complete: async (id: string): Promise<Task> => {
    const response = await api.put(`/tasks/${id}/complete`);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },
};

// =====================================================
// DASHBOARD APIs
// =====================================================
export const dashboardAPI = {
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await api.get('/dashboard/summary');
    return response.data;
  },

  getPipelineByStatus: async (): Promise<{ data: Array<{ lead_status: string; count: number; total_value: number; avg_score: number }> }> => {
    const response = await api.get('/dashboard/pipeline');
    return response.data;
  },

  getSalesPerformance: async (): Promise<{ data: Array<{ id: string; name: string; total_leads: number; won_deals: number; won_value: number }> }> => {
    const response = await api.get('/dashboard/sales-performance');
    return response.data;
  },

  getLeadSourceAnalytics: async (): Promise<{ data: Array<{ lead_source: string; total_leads: number; won: number; win_rate: number }> }> => {
    const response = await api.get('/dashboard/lead-sources');
    return response.data;
  },
};

export default api;
