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
  Card,
  CardContent,
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
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Business as BusinessIcon,
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

interface KPIStats {
  totalLeads: number;
  earlyStage: number;      // Stages 1-5: New Lead → In-person Meeting Requested
  holdStage: number;       // Stages 6-7: Deferred, Info Collection Pending
  qualification: number;   // Stages 8-10: Tech Review, Commercial, Qualified Lead
  salesStage: number;      // Stages 11-13: Proposal Sent, Negotiation, Contract Sent
  won: number;             // Stage 14: Won
  lost: number;            // Stage 15: Lost
  disqualified: number;    // Stage 16: Disqualified / Nurture
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
    totalLeads: 0,
    earlyStage: 0,
    holdStage: 0,
    qualification: 0,
    salesStage: 0,
    won: 0,
    lost: 0,
    disqualified: 0,
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

      // Calculate KPIs by category
      setStats({
        totalLeads: allLeads.length,
        // Early Stage (1-5): New Lead, Initial Assessment, First Contact, Customer Interaction, In-person Meeting
        earlyStage: allLeads.filter(l =>
          l.lead_status === LeadStatus.NEW_LEAD ||
          l.lead_status === LeadStatus.INITIAL_ASSESSMENT ||
          l.lead_status === LeadStatus.FIRST_CONTACT_ATTEMPTED ||
          l.lead_status === LeadStatus.CUSTOMER_INTERACTION_COMPLETED ||
          l.lead_status === LeadStatus.IN_PERSON_MEETING_REQUESTED
        ).length,
        // Hold Stage (6-7): Deferred, Information Collection Pending
        holdStage: allLeads.filter(l =>
          l.lead_status === LeadStatus.DEFERRED_FOLLOW_UP_LATER ||
          l.lead_status === LeadStatus.INFORMATION_COLLECTION_PENDING
        ).length,
        // Qualification (8-10): Tech Feasibility, Commercial Qualification, Qualified Lead
        qualification: allLeads.filter(l =>
          l.lead_status === LeadStatus.TECHNICAL_FEASIBILITY_UNDER_REVIEW ||
          l.lead_status === LeadStatus.COMMERCIAL_QUALIFICATION ||
          l.lead_status === LeadStatus.QUALIFIED_LEAD
        ).length,
        // Sales Stage (11-13): Proposal Sent, Negotiation, Contract Sent
        salesStage: allLeads.filter(l =>
          l.lead_status === LeadStatus.PROPOSAL_SENT ||
          l.lead_status === LeadStatus.NEGOTIATION ||
          l.lead_status === LeadStatus.CONTRACT_SENT
        ).length,
        // Outcome stages
        won: allLeads.filter(l => l.lead_status === LeadStatus.WON).length,
        lost: allLeads.filter(l => l.lead_status === LeadStatus.LOST).length,
        disqualified: allLeads.filter(l => l.lead_status === LeadStatus.DISQUALIFIED_NURTURE).length,
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

      {/* KPI Cards - 8 cards in 2 rows showing leads by pipeline category */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Row 1 */}
        <Grid item xs={6} sm={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                    {stats.totalLeads}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Total Leads
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 40, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                    {stats.earlyStage}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Early Stage
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    New to Meeting
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                    {stats.holdStage}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    On Hold
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Deferred / Pending
                  </Typography>
                </Box>
                <ScheduleIcon sx={{ fontSize: 40, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                    {stats.qualification}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Qualification
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Tech & Commercial
                  </Typography>
                </Box>
                <BusinessIcon sx={{ fontSize: 40, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Row 2 */}
        <Grid item xs={6} sm={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                    {stats.salesStage}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Sales Stage
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Proposal to Contract
                  </Typography>
                </Box>
                <WhatshotIcon sx={{ fontSize: 40, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                    {stats.won}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Won Deals
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 40, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)' }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                    {stats.lost}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Lost Deals
                  </Typography>
                </Box>
                <CancelIcon sx={{ fontSize: 40, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#333' }}>
                    {stats.disqualified}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.6)' }}>
                    Disqualified / Nurture
                  </Typography>
                </Box>
                <PhoneIcon sx={{ fontSize: 40, color: 'rgba(0,0,0,0.15)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
