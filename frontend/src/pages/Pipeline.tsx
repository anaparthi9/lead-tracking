import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  Grid,
  CircularProgress,
  TextField,
  MenuItem,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  ArrowForward as ArrowForwardIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  Whatshot as WhatshotIcon,
} from '@mui/icons-material';
import { leadAPI } from '../services/api';
import type { Lead } from '../types';
import { LEAD_STATUS_ORDER, LeadStatus, LeadTemperature, LEAD_SOURCES, INDUSTRY_SECTORS, INDIAN_STATES } from '../types';

export default function Pipeline() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    state: '',
    industry_sector: '',
    lead_source: '',
    temperature: '',
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    loadLeads();
  }, [filters]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const cleanFilters: Record<string, string> = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value) cleanFilters[key] = value;
      });
      const response = await leadAPI.getAll(cleanFilters);
      setLeads(response.data);
    } catch (error) {
      console.error('Failed to load leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLeadsByStatus = (status: LeadStatus) => {
    return leads.filter((lead) => lead.lead_status === status);
  };

  const handleCardClick = (leadId: string) => {
    navigate(`/leads/${leadId}`);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, lead: Lead) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedLead(lead);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedLead(null);
  };

  const handleMoveToNextStage = async () => {
    if (!selectedLead) return;
    const currentIndex = LEAD_STATUS_ORDER.indexOf(selectedLead.lead_status);
    if (currentIndex < LEAD_STATUS_ORDER.length - 1) {
      const nextStatus = LEAD_STATUS_ORDER[currentIndex + 1];
      try {
        await leadAPI.changeStatus(selectedLead.id, nextStatus);
        loadLeads();
      } catch (error) {
        console.error('Failed to change status:', error);
      }
    }
    handleMenuClose();
  };

  const getStatusColor = (status: LeadStatus) => {
    const colors: Record<string, string> = {
      // Early Stage
      'New Lead': '#E8F5E9',
      'Initial Assessment': '#E3F2FD',
      'First Contact Attempted': '#FFF8E1',
      'Customer Interaction Completed': '#E1F5FE',
      'In-person Meeting Requested': '#F3E5F5',
      // Hold/Defer
      'Deferred - Follow Up Later': '#FFF3E0',
      'Information Collection Pending': '#E0F2F1',
      // Qualification
      'Technical Feasibility Under Review': '#FCE4EC',
      'Commercial Qualification': '#E8EAF6',
      'Qualified Lead': '#C8E6C9',
      // Sales Stage
      'Proposal Sent': '#E1BEE7',
      'Negotiation': '#BBDEFB',
      'Contract Sent': '#B2DFDB',
      // Outcome
      'Won': '#A5D6A7',
      'Lost': '#FFCDD2',
      'Disqualified / Nurture': '#FFEBEE',
    };
    return colors[status] || '#F5F6F7';
  };

  const getTemperatureIcon = (temp: LeadTemperature) => {
    switch (temp) {
      case LeadTemperature.HOT:
        return <WhatshotIcon sx={{ color: '#f44336', fontSize: 16 }} />;
      case LeadTemperature.WARM:
        return <WhatshotIcon sx={{ color: '#ff9800', fontSize: 16 }} />;
      default:
        return <WhatshotIcon sx={{ color: '#90a4ae', fontSize: 16 }} />;
    }
  };

  const getGradeColor = (grade?: string) => {
    switch (grade) {
      case 'A': return '#4caf50';
      case 'B': return '#8bc34a';
      case 'C': return '#ff9800';
      case 'D': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    if (value >= 10000000) return `${(value / 10000000).toFixed(1)} Cr`;
    if (value >= 100000) return `${(value / 100000).toFixed(1)} L`;
    return `${value.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold', fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' } }}>
        Sales Pipeline
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              select
              label="State"
              value={filters.state}
              onChange={(e) => setFilters({ ...filters, state: e.target.value })}
              size="small"
            >
              <MenuItem value="">All States</MenuItem>
              {INDIAN_STATES.map((state) => (
                <MenuItem key={state} value={state}>{state}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              select
              label="Industry"
              value={filters.industry_sector}
              onChange={(e) => setFilters({ ...filters, industry_sector: e.target.value })}
              size="small"
            >
              <MenuItem value="">All Industries</MenuItem>
              {INDUSTRY_SECTORS.map((industry) => (
                <MenuItem key={industry} value={industry}>{industry}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              select
              label="Lead Source"
              value={filters.lead_source}
              onChange={(e) => setFilters({ ...filters, lead_source: e.target.value })}
              size="small"
            >
              <MenuItem value="">All Sources</MenuItem>
              {LEAD_SOURCES.map((source) => (
                <MenuItem key={source} value={source}>{source}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              select
              label="Temperature"
              value={filters.temperature}
              onChange={(e) => setFilters({ ...filters, temperature: e.target.value })}
              size="small"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Hot">Hot</MenuItem>
              <MenuItem value="Warm">Warm</MenuItem>
              <MenuItem value="Cold">Cold</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Kanban Board - 11 Lead Qualification Stages */}
      <Box sx={{ overflowX: 'auto', pb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, minWidth: 'max-content' }}>
          {LEAD_STATUS_ORDER.map((status) => {
            const statusLeads = getLeadsByStatus(status);
            const totalValue = statusLeads.reduce((sum, lead) => sum + (lead.deal_size_estimate || 0), 0);
            const hotCount = statusLeads.filter(l => l.temperature === LeadTemperature.HOT).length;

            return (
              <Box
                key={status}
                sx={{
                  minWidth: { xs: 260, sm: 280 },
                  maxWidth: { xs: 260, sm: 280 },
                  backgroundColor: getStatusColor(status),
                  borderRadius: 3,
                  p: 1.5,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold', mb: 1 }}>
                    {status}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 0.5 }}>
                    <Chip
                      label={`${statusLeads.length} leads`}
                      size="small"
                      sx={{ fontSize: '0.75rem' }}
                    />
                    <Chip
                      label={formatCurrency(totalValue)}
                      size="small"
                      color="primary"
                      sx={{ fontSize: '0.75rem' }}
                    />
                    {hotCount > 0 && (
                      <Badge badgeContent={hotCount} color="error" sx={{ ml: 1 }}>
                        <WhatshotIcon sx={{ color: '#f44336', fontSize: 18 }} />
                      </Badge>
                    )}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: '60vh', overflowY: 'auto' }}>
                  {statusLeads.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      No leads
                    </Typography>
                  ) : (
                    statusLeads.map((lead) => (
                      <Card
                        key={lead.id}
                        sx={{
                          cursor: 'pointer',
                          borderRadius: 2,
                          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                          '&:hover': {
                            boxShadow: '0 4px 12px rgba(0, 200, 83, 0.25)',
                            transform: 'translateY(-2px)',
                            borderColor: '#00C853',
                          },
                          transition: 'all 0.2s',
                          border: lead.temperature === LeadTemperature.HOT ? '2px solid #f44336' : '1px solid transparent',
                        }}
                        onClick={() => handleCardClick(lead.id)}
                      >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5, flex: 1 }}>
                              {lead.company_name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {getTemperatureIcon(lead.temperature)}
                              <IconButton
                                size="small"
                                onClick={(e) => handleMenuOpen(e, lead)}
                                sx={{ p: 0.5 }}
                              >
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {lead.industry_sector && (
                              <Typography variant="caption" color="text.secondary">
                                {lead.industry_sector}
                              </Typography>
                            )}
                            {(lead.city || lead.state) && (
                              <Typography variant="caption" color="text.secondary">
                                {[lead.city, lead.state].filter(Boolean).join(', ')}
                              </Typography>
                            )}
                            {lead.monthly_consumption_kwh && (
                              <Typography variant="caption" sx={{ color: 'primary.main' }}>
                                {lead.monthly_consumption_kwh.toLocaleString('en-IN')} kWh/month
                              </Typography>
                            )}
                          </Box>

                          <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              {lead.lead_grade && (
                                <Chip
                                  label={`Grade ${lead.lead_grade}`}
                                  size="small"
                                  sx={{
                                    fontSize: '0.65rem',
                                    height: 20,
                                    backgroundColor: getGradeColor(lead.lead_grade),
                                    color: 'white',
                                  }}
                                />
                              )}
                              {lead.preferred_model && (
                                <Chip
                                  label={lead.preferred_model}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.65rem', height: 20 }}
                                />
                              )}
                            </Box>
                            <Tooltip title="Lead Score">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <TrendingUpIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                  {lead.lead_score}
                                </Typography>
                              </Box>
                            </Tooltip>
                          </Box>

                          {lead.deal_size_estimate && (
                            <Typography
                              variant="caption"
                              sx={{ display: 'block', mt: 1, fontWeight: 'bold', color: '#00C853' }}
                            >
                              {formatCurrency(lead.deal_size_estimate)}
                            </Typography>
                          )}

                          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              {lead.assigned_user_name || 'Unassigned'}
                            </Typography>
                            {lead.next_action_date && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CalendarIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(lead.next_action_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={handleMoveToNextStage}>
          <ListItemIcon>
            <ArrowForwardIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Move to Next Stage</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); if (selectedLead) navigate(`/leads/${selectedLead.id}`); }}>
          <ListItemIcon>
            <PhoneIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Log Call</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); if (selectedLead) navigate(`/leads/${selectedLead.id}`); }}>
          <ListItemIcon>
            <EmailIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Send Email</ListItemText>
        </MenuItem>
      </Menu>

      {/* Summary */}
      <Paper sx={{ p: { xs: 2, md: 3 }, mt: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: { xs: 'left', sm: 'center' } }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                Total Leads in Pipeline
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#00C853' }}>
                {leads.length}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: { xs: 'left', sm: 'center' } }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                Total Pipeline Value
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#00C853' }}>
                {formatCurrency(leads.reduce((sum, lead) => sum + (lead.deal_size_estimate || 0), 0))}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: { xs: 'left', sm: 'center' } }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                Hot Leads
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#f44336' }}>
                {leads.filter(l => l.temperature === LeadTemperature.HOT).length}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
