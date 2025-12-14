import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Grid,
  Button,
  InputAdornment,
  CircularProgress,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterIcon,
  Whatshot as WhatshotIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { leadAPI } from '../services/api';
import type { Lead } from '../types';
import {
  LeadStatus,
  LeadTemperature,
  LEAD_SOURCES,
  INDUSTRY_SECTORS,
  INDIAN_STATES,
  PreferredModel,
} from '../types';

interface StageCount {
  name: string;
  count: number;
}

interface CategoryStats {
  total: number;
  stages: StageCount[];
}

interface KPIStats {
  early: CategoryStats;
  hold: CategoryStats;
  qualification: CategoryStats;
  sales: CategoryStats;
  outcome: CategoryStats;
}

export default function Leads() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState<KPIStats>({
    early: { total: 0, stages: [] },
    hold: { total: 0, stages: [] },
    qualification: { total: 0, stages: [] },
    sales: { total: 0, stages: [] },
    outcome: { total: 0, stages: [] },
  });
  const [filters, setFilters] = useState({
    lead_status: '',
    temperature: '',
    industry_sector: '',
    state: '',
    lead_source: '',
    preferred_model: '',
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    loadLeads();
  }, [page, rowsPerPage, filters]);

  useEffect(() => {
    loadAllLeadsForStats();
  }, []);

  const loadAllLeadsForStats = async () => {
    try {
      const response = await leadAPI.getAll({ limit: 10000 });
      const allLeads = response.data;

      // Helper to count leads by status
      const countByStatus = (status: LeadStatus) =>
        allLeads.filter(l => l.lead_status === status).length;

      // Calculate KPIs by category with individual stage counts
      const earlyStages = [
        { name: 'New Lead', count: countByStatus(LeadStatus.NEW_LEAD) },
        { name: 'Initial Assessment', count: countByStatus(LeadStatus.INITIAL_ASSESSMENT) },
        { name: 'First Contact', count: countByStatus(LeadStatus.FIRST_CONTACT_ATTEMPTED) },
        { name: 'Customer Interaction', count: countByStatus(LeadStatus.CUSTOMER_INTERACTION_COMPLETED) },
        { name: 'Meeting Requested', count: countByStatus(LeadStatus.IN_PERSON_MEETING_REQUESTED) },
      ];

      const holdStages = [
        { name: 'Deferred', count: countByStatus(LeadStatus.DEFERRED_FOLLOW_UP_LATER) },
        { name: 'Info Pending', count: countByStatus(LeadStatus.INFORMATION_COLLECTION_PENDING) },
      ];

      const qualificationStages = [
        { name: 'Tech Review', count: countByStatus(LeadStatus.TECHNICAL_FEASIBILITY_UNDER_REVIEW) },
        { name: 'Commercial', count: countByStatus(LeadStatus.COMMERCIAL_QUALIFICATION) },
        { name: 'Qualified', count: countByStatus(LeadStatus.QUALIFIED_LEAD) },
      ];

      const salesStages = [
        { name: 'Proposal Sent', count: countByStatus(LeadStatus.PROPOSAL_SENT) },
        { name: 'Negotiation', count: countByStatus(LeadStatus.NEGOTIATION) },
        { name: 'Contract Sent', count: countByStatus(LeadStatus.CONTRACT_SENT) },
      ];

      const outcomeStages = [
        { name: 'Won', count: countByStatus(LeadStatus.WON) },
        { name: 'Lost', count: countByStatus(LeadStatus.LOST) },
        { name: 'Disqualified', count: countByStatus(LeadStatus.DISQUALIFIED_NURTURE) },
      ];

      setStats({
        early: { total: earlyStages.reduce((sum, s) => sum + s.count, 0), stages: earlyStages },
        hold: { total: holdStages.reduce((sum, s) => sum + s.count, 0), stages: holdStages },
        qualification: { total: qualificationStages.reduce((sum, s) => sum + s.count, 0), stages: qualificationStages },
        sales: { total: salesStages.reduce((sum, s) => sum + s.count, 0), stages: salesStages },
        outcome: { total: outcomeStages.reduce((sum, s) => sum + s.count, 0), stages: outcomeStages },
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadLeads = async () => {
    try {
      setLoading(true);
      const cleanFilters: Record<string, string | number> = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value) cleanFilters[key] = value;
      });
      if (search) cleanFilters.search = search;
      cleanFilters.page = page + 1;
      cleanFilters.limit = rowsPerPage;

      const response = await leadAPI.getAll(cleanFilters as any);
      setLeads(response.data);
      setTotal(response.pagination?.total || response.data.length);
    } catch (error) {
      console.error('Failed to load leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(0);
    loadLeads();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
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

  const handleDelete = async () => {
    if (!selectedLead) return;
    try {
      await leadAPI.delete(selectedLead.id);
      loadLeads();
    } catch (error) {
      console.error('Failed to delete lead:', error);
    }
    setDeleteDialogOpen(false);
    handleMenuClose();
  };

  const getStatusColor = (status: LeadStatus): 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' => {
    const colors: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'> = {
      // Early Stage
      'New Lead': 'info',
      'Initial Assessment': 'primary',
      'First Contact Attempted': 'warning',
      'Customer Interaction Completed': 'info',
      'In-person Meeting Requested': 'secondary',
      // Hold/Defer
      'Deferred - Follow Up Later': 'warning',
      'Information Collection Pending': 'default',
      // Qualification
      'Technical Feasibility Under Review': 'secondary',
      'Commercial Qualification': 'primary',
      'Qualified Lead': 'success',
      // Sales Stage
      'Proposal Sent': 'secondary',
      'Negotiation': 'primary',
      'Contract Sent': 'info',
      // Outcome
      'Won': 'success',
      'Lost': 'error',
      'Disqualified / Nurture': 'error',
    };
    return colors[status] || 'default';
  };

  const getTemperatureIcon = (temp: LeadTemperature) => {
    switch (temp) {
      case LeadTemperature.HOT:
        return <WhatshotIcon sx={{ color: '#f44336', fontSize: 18 }} />;
      case LeadTemperature.WARM:
        return <WhatshotIcon sx={{ color: '#ff9800', fontSize: 18 }} />;
      default:
        return <WhatshotIcon sx={{ color: '#90a4ae', fontSize: 18 }} />;
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    if (value >= 10000000) return `${(value / 10000000).toFixed(1)} Cr`;
    if (value >= 100000) return `${(value / 100000).toFixed(1)} L`;
    return `${value.toLocaleString('en-IN')}`;
  };

  const clearFilters = () => {
    setFilters({
      lead_status: '',
      temperature: '',
      industry_sector: '',
      state: '',
      lead_source: '',
      preferred_model: '',
    });
    setSearch('');
    setPage(0);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Leads
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/leads/new')}
          sx={{ borderRadius: 2 }}
        >
          Add Lead
        </Button>
      </Box>

      {/* KPI Cards - Clean, Modern Pipeline Overview */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          {/* Early Stage */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: '1px solid #e0e0e0',
                height: '100%',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  borderColor: '#10b981'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10b981' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151', letterSpacing: 0.5 }}>
                  EARLY STAGE
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#10b981', mb: 2 }}>
                {stats.early.total}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {stats.early.stages.map((stage, idx) => (
                  <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                      {idx + 1}. {stage.name}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151', bgcolor: '#f3f4f6', px: 1, py: 0.25, borderRadius: 1 }}>
                      {stage.count}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Hold Stage */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: '1px solid #e0e0e0',
                height: '100%',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  borderColor: '#f59e0b'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#f59e0b' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151', letterSpacing: 0.5 }}>
                  HOLD / DEFER
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#f59e0b', mb: 2 }}>
                {stats.hold.total}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {stats.hold.stages.map((stage, idx) => (
                  <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                      {idx + 6}. {stage.name}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151', bgcolor: '#f3f4f6', px: 1, py: 0.25, borderRadius: 1 }}>
                      {stage.count}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Qualification Stage */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: '1px solid #e0e0e0',
                height: '100%',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  borderColor: '#3b82f6'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#3b82f6' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151', letterSpacing: 0.5 }}>
                  QUALIFICATION
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#3b82f6', mb: 2 }}>
                {stats.qualification.total}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {stats.qualification.stages.map((stage, idx) => (
                  <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                      {idx + 8}. {stage.name}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151', bgcolor: '#f3f4f6', px: 1, py: 0.25, borderRadius: 1 }}>
                      {stage.count}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Sales Stage */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: '1px solid #e0e0e0',
                height: '100%',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  borderColor: '#8b5cf6'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#8b5cf6' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151', letterSpacing: 0.5 }}>
                  SALES
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#8b5cf6', mb: 2 }}>
                {stats.sales.total}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {stats.sales.stages.map((stage, idx) => (
                  <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                      {idx + 11}. {stage.name}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151', bgcolor: '#f3f4f6', px: 1, py: 0.25, borderRadius: 1 }}>
                      {stage.count}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Outcome Stage */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: '1px solid #e0e0e0',
                height: '100%',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  borderColor: '#6366f1'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#6366f1' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151', letterSpacing: 0.5 }}>
                  OUTCOME
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#6366f1', mb: 2 }}>
                {stats.outcome.total}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {stats.outcome.stages.map((stage, idx) => (
                  <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                      {idx + 14}. {stage.name}
                    </Typography>
                    <Typography variant="caption" sx={{
                      fontWeight: 600,
                      color: stage.name === 'Won' ? '#10b981' : stage.name === 'Lost' ? '#ef4444' : '#374151',
                      bgcolor: stage.name === 'Won' ? '#d1fae5' : stage.name === 'Lost' ? '#fee2e2' : '#f3f4f6',
                      px: 1,
                      py: 0.25,
                      borderRadius: 1
                    }}>
                      {stage.count}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Search and Filter Bar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by company name, city, state..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={handleKeyPress}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <Button
              fullWidth
              variant={showFilters ? 'contained' : 'outlined'}
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
          </Grid>
          <Grid item xs={6} md={3}>
            <Button fullWidth variant="outlined" onClick={clearFilters}>
              Clear All
            </Button>
          </Grid>
        </Grid>

        {/* Advanced Filters */}
        {showFilters && (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Status"
                value={filters.lead_status}
                onChange={(e) => setFilters({ ...filters, lead_status: e.target.value })}
                size="small"
              >
                <MenuItem value="">All</MenuItem>
                {Object.values(LeadStatus).map((status) => (
                  <MenuItem key={status} value={status}>{status}</MenuItem>
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
                {Object.values(LeadTemperature).map((temp) => (
                  <MenuItem key={temp} value={temp}>{temp}</MenuItem>
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
                <MenuItem value="">All</MenuItem>
                {INDUSTRY_SECTORS.map((industry) => (
                  <MenuItem key={industry} value={industry}>{industry}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="State"
                value={filters.state}
                onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                size="small"
              >
                <MenuItem value="">All</MenuItem>
                {INDIAN_STATES.map((state) => (
                  <MenuItem key={state} value={state}>{state}</MenuItem>
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
                <MenuItem value="">All</MenuItem>
                {LEAD_SOURCES.map((source) => (
                  <MenuItem key={source} value={source}>{source}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Preferred Model"
                value={filters.preferred_model}
                onChange={(e) => setFilters({ ...filters, preferred_model: e.target.value })}
                size="small"
              >
                <MenuItem value="">All</MenuItem>
                {Object.values(PreferredModel).map((model) => (
                  <MenuItem key={model} value={model}>{model}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Table sx={{ minWidth: 1000 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Company</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>City</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>State</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Industry / Sector</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">Temp</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Consumption</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Deal Size</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Source</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No leads found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => (
                    <TableRow
                      key={lead.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/leads/${lead.id}`)}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {lead.company_name}
                        </Typography>
                        {lead.gstin && (
                          <Typography variant="caption" color="text.secondary">
                            GSTIN: {lead.gstin}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{lead.city || '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{lead.state || '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{lead.industry_sector || '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={lead.lead_status}
                          size="small"
                          color={getStatusColor(lead.lead_status)}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={lead.temperature}>
                          {getTemperatureIcon(lead.temperature)}
                        </Tooltip>
                      </TableCell>
                      <TableCell align="right">
                        {lead.monthly_consumption_kwh
                          ? `${lead.monthly_consumption_kwh.toLocaleString('en-IN')} kWh`
                          : '-'}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#00C853' }}>
                          {formatCurrency(lead.deal_size_estimate)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{lead.lead_source || '-'}</Typography>
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, lead)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={total}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </>
        )}
      </TableContainer>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { handleMenuClose(); if (selectedLead) navigate(`/leads/${selectedLead.id}`); }}>
          <ListItemIcon><ViewIcon fontSize="small" /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); if (selectedLead) navigate(`/leads/${selectedLead.id}/edit`); }}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); /* TODO: Open call dialog */ }}>
          <ListItemIcon><PhoneIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Log Call</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); /* TODO: Open email dialog */ }}>
          <ListItemIcon><EmailIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Send Email</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setDeleteDialogOpen(true); }} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the lead "{selectedLead?.company_name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
