import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  TrendingUp as TrendingUpIcon,
  Whatshot as WhatshotIcon,
  Assignment as TaskIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Note as NoteIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { leadAPI, activityAPI, taskAPI } from '../services/api';
import type { Lead, LeadContact, LeadStageHistory, Activity, Task } from '../types';
import { LeadStatus, LeadTemperature, ActivityType, TaskType, TaskPriority, LEAD_STATUS_ORDER } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [lead, setLead] = useState<Lead | null>(null);
  const [contacts, setContacts] = useState<LeadContact[]>([]);
  const [history, setHistory] = useState<LeadStageHistory[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tabValue, setTabValue] = useState(0);

  // Dialog states
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newActivity, setNewActivity] = useState({
    activity_type: ActivityType.PHONE_CALL,
    subject: '',
    notes: '',
    outcome: '',
    duration_minutes: 0,
  });
  const [newTask, setNewTask] = useState({
    task_type: TaskType.FOLLOW_UP_CALL,
    title: '',
    description: '',
    due_date: '',
    priority: TaskPriority.MEDIUM,
  });
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');

  useEffect(() => {
    if (id) loadLead();
  }, [id]);

  const loadLead = async () => {
    try {
      setLoading(true);
      const response = await leadAPI.getById(id!);
      setLead(response.lead);
      setContacts(response.contacts || []);
      setHistory(response.history || []);
      setActivities(response.activities || []);
      setTasks(response.tasks || []);
    } catch (error) {
      console.error('Failed to load lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogActivity = async () => {
    try {
      await activityAPI.create({
        lead_id: id,
        activity_type: newActivity.activity_type,
        activity_date: new Date().toISOString(),
        subject: newActivity.subject,
        notes: newActivity.notes,
        outcome: newActivity.outcome,
        duration_minutes: newActivity.duration_minutes,
      });
      setActivityDialogOpen(false);
      setNewActivity({ activity_type: ActivityType.PHONE_CALL, subject: '', notes: '', outcome: '', duration_minutes: 0 });
      loadLead();
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  };

  const handleCreateTask = async () => {
    try {
      await taskAPI.create({
        lead_id: id,
        task_type: newTask.task_type,
        title: newTask.title,
        description: newTask.description,
        due_date: newTask.due_date,
        priority: newTask.priority,
      });
      setTaskDialogOpen(false);
      setNewTask({ task_type: TaskType.FOLLOW_UP_CALL, title: '', description: '', due_date: '', priority: TaskPriority.MEDIUM });
      loadLead();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await taskAPI.complete(taskId);
      loadLead();
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const handleChangeStatus = async () => {
    try {
      await leadAPI.changeStatus(id!, newStatus, statusNotes);
      setStatusDialogOpen(false);
      setNewStatus('');
      setStatusNotes('');
      loadLead();
    } catch (error) {
      console.error('Failed to change status:', error);
    }
  };

  const getStatusColor = (status: LeadStatus): 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' => {
    const colors: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'> = {
      'New': 'info',
      'Qualified': 'primary',
      'Site Survey': 'warning',
      'Proposal': 'secondary',
      'Negotiation': 'primary',
      'Won': 'success',
      'Lost': 'error',
    };
    return colors[status] || 'default';
  };

  const getTemperatureIcon = (temp: LeadTemperature) => {
    switch (temp) {
      case LeadTemperature.HOT:
        return <WhatshotIcon sx={{ color: '#f44336' }} />;
      case LeadTemperature.WARM:
        return <WhatshotIcon sx={{ color: '#ff9800' }} />;
      default:
        return <WhatshotIcon sx={{ color: '#90a4ae' }} />;
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

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case ActivityType.PHONE_CALL: return <PhoneIcon />;
      case ActivityType.EMAIL_SENT: return <EmailIcon />;
      case ActivityType.MEETING: return <PersonIcon />;
      case ActivityType.SITE_VISIT: return <LocationIcon />;
      default: return <NoteIcon />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!lead) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">Lead not found</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/leads')} sx={{ mt: 2 }}>
          Back to Leads
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <IconButton onClick={() => navigate('/leads')}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {lead.company_name}
            </Typography>
            {getTemperatureIcon(lead.temperature)}
            <Chip label={lead.lead_status} color={getStatusColor(lead.lead_status)} />
            {lead.lead_grade && (
              <Chip
                label={`Grade ${lead.lead_grade}`}
                sx={{ backgroundColor: getGradeColor(lead.lead_grade), color: 'white' }}
              />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {[lead.city, lead.state].filter(Boolean).join(', ')} | {lead.industry_sector || 'No industry'}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/leads/${id}/edit`)}
        >
          Edit
        </Button>
        <Button
          variant="contained"
          onClick={() => setStatusDialogOpen(true)}
        >
          Change Status
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Main Info */}
        <Grid item xs={12} lg={8}>
          {/* Quick Actions */}
          <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<PhoneIcon />}
                onClick={() => { setNewActivity({ ...newActivity, activity_type: ActivityType.PHONE_CALL }); setActivityDialogOpen(true); }}
              >
                Log Call
              </Button>
              <Button
                variant="outlined"
                startIcon={<EmailIcon />}
                onClick={() => { setNewActivity({ ...newActivity, activity_type: ActivityType.EMAIL_SENT }); setActivityDialogOpen(true); }}
              >
                Log Email
              </Button>
              <Button
                variant="outlined"
                startIcon={<PersonIcon />}
                onClick={() => { setNewActivity({ ...newActivity, activity_type: ActivityType.MEETING }); setActivityDialogOpen(true); }}
              >
                Log Meeting
              </Button>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setTaskDialogOpen(true)}
              >
                Add Task
              </Button>
            </Box>
          </Paper>

          {/* Tabs */}
          <Paper sx={{ borderRadius: 3 }}>
            <Tabs
              value={tabValue}
              onChange={(_, v) => setTabValue(v)}
              sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
            >
              <Tab label="Overview" />
              <Tab label={`Activities (${activities.length})`} />
              <Tab label={`Tasks (${tasks.filter(t => t.status !== 'completed').length})`} />
              <Tab label="History" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {/* Overview Tab */}
              <TabPanel value={tabValue} index={0}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Company Information
                    </Typography>
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <BusinessIcon color="action" fontSize="small" />
                          <Typography>{lead.company_name}</Typography>
                        </Box>
                        {lead.gstin && (
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                            GSTIN: {lead.gstin}
                          </Typography>
                        )}
                        {lead.website_url && (
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                            Website: {lead.website_url}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          <LocationIcon color="action" fontSize="small" />
                          <Typography variant="body2">
                            {lead.address_full || [lead.city, lead.state, lead.pin_code].filter(Boolean).join(', ') || 'No address'}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>

                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Qualification Data
                    </Typography>
                    <Card variant="outlined">
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Sanctioned Load</Typography>
                            <Typography>{lead.sanctioned_load_kva ? `${lead.sanctioned_load_kva} kVA` : '-'}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Monthly Consumption</Typography>
                            <Typography>{lead.monthly_consumption_kwh ? `${lead.monthly_consumption_kwh.toLocaleString('en-IN')} kWh` : '-'}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Current Tariff</Typography>
                            <Typography>{lead.current_tariff_per_kwh ? `${lead.current_tariff_per_kwh}/kWh` : '-'}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Ownership</Typography>
                            <Typography>{lead.ownership_status || '-'}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Roof Type</Typography>
                            <Typography>{lead.roof_type || '-'}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Available Area</Typography>
                            <Typography>{lead.available_area_sqft ? `${lead.available_area_sqft.toLocaleString('en-IN')} sq ft` : '-'}</Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Current Infrastructure
                    </Typography>
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip
                            label={lead.has_solar ? `Solar: ${lead.solar_capacity_kw} kW` : 'No Solar'}
                            color={lead.has_solar ? 'success' : 'default'}
                            variant={lead.has_solar ? 'filled' : 'outlined'}
                          />
                          <Chip
                            label={lead.has_battery ? `Battery: ${lead.battery_capacity_kwh} kWh` : 'No Battery'}
                            color={lead.has_battery ? 'success' : 'default'}
                            variant={lead.has_battery ? 'filled' : 'outlined'}
                          />
                          <Chip
                            label={lead.has_dg ? `DG: ${lead.dg_capacity_kva} kVA` : 'No DG'}
                            color={lead.has_dg ? 'warning' : 'default'}
                            variant={lead.has_dg ? 'filled' : 'outlined'}
                          />
                        </Box>
                      </CardContent>
                    </Card>

                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Sales Information
                    </Typography>
                    <Card variant="outlined">
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Lead Score</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <TrendingUpIcon color="primary" />
                              <Typography variant="h6">{lead.lead_score}</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Deal Size</Typography>
                            <Typography variant="h6" sx={{ color: '#00C853' }}>
                              {formatCurrency(lead.deal_size_estimate)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Lead Source</Typography>
                            <Typography>{lead.lead_source || '-'}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Preferred Model</Typography>
                            <Typography>{lead.preferred_model || '-'}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Assigned To</Typography>
                            <Typography>{lead.assigned_user_name || 'Unassigned'}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Next Action</Typography>
                            <Typography>
                              {lead.next_action_date
                                ? new Date(lead.next_action_date).toLocaleDateString('en-IN')
                                : '-'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </TabPanel>

              {/* Activities Tab */}
              <TabPanel value={tabValue} index={1}>
                {activities.length === 0 ? (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No activities logged yet
                  </Typography>
                ) : (
                  <List>
                    {activities.map((activity) => (
                      <ListItem key={activity.id} alignItems="flex-start" divider>
                        <ListItemIcon>{getActivityIcon(activity.activity_type)}</ListItemIcon>
                        <ListItemText
                          primary={activity.subject || activity.activity_type.replace('_', ' ')}
                          secondary={
                            <>
                              <Typography variant="body2" color="text.secondary">
                                {activity.notes}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(activity.activity_date).toLocaleString('en-IN')}
                                {activity.duration_minutes && ` | ${activity.duration_minutes} min`}
                                {activity.outcome && ` | Outcome: ${activity.outcome}`}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </TabPanel>

              {/* Tasks Tab */}
              <TabPanel value={tabValue} index={2}>
                {tasks.length === 0 ? (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No tasks created yet
                  </Typography>
                ) : (
                  <List>
                    {tasks.map((task) => (
                      <ListItem
                        key={task.id}
                        divider
                        secondaryAction={
                          task.status !== 'completed' && (
                            <IconButton onClick={() => handleCompleteTask(task.id)}>
                              <CheckCircleIcon color="success" />
                            </IconButton>
                          )
                        }
                      >
                        <ListItemIcon>
                          {task.status === 'completed' ? (
                            <CheckCircleIcon color="success" />
                          ) : (
                            <ScheduleIcon color={task.priority === 'urgent' ? 'error' : 'action'} />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography
                              sx={{ textDecoration: task.status === 'completed' ? 'line-through' : 'none' }}
                            >
                              {task.title}
                            </Typography>
                          }
                          secondary={
                            <>
                              {task.description && (
                                <Typography variant="body2" color="text.secondary">
                                  {task.description}
                                </Typography>
                              )}
                              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                <Chip
                                  label={new Date(task.due_date).toLocaleDateString('en-IN')}
                                  size="small"
                                  variant="outlined"
                                />
                                <Chip
                                  label={task.priority}
                                  size="small"
                                  color={task.priority === 'urgent' ? 'error' : task.priority === 'high' ? 'warning' : 'default'}
                                />
                              </Box>
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </TabPanel>

              {/* History Tab */}
              <TabPanel value={tabValue} index={3}>
                {history.length === 0 ? (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No stage changes recorded
                  </Typography>
                ) : (
                  <List>
                    {history.map((item, index) => (
                      <ListItem
                        key={item.id}
                        sx={{
                          borderLeft: '3px solid',
                          borderColor: index === 0 ? 'primary.main' : 'grey.300',
                          mb: 2,
                          backgroundColor: index === 0 ? 'rgba(0, 200, 83, 0.08)' : 'transparent',
                          borderRadius: 1,
                        }}
                      >
                        <ListItemIcon>
                          <HistoryIcon color={index === 0 ? 'primary' : 'action'} />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2">
                              {item.from_status ? `${item.from_status} → ${item.to_status}` : item.to_status}
                            </Typography>
                          }
                          secondary={
                            <>
                              <Typography variant="caption" color="text.secondary" component="span">
                                {new Date(item.changed_at).toLocaleString('en-IN')}
                              </Typography>
                              {item.notes && (
                                <Typography variant="body2" color="text.secondary" component="p">
                                  {item.notes}
                                </Typography>
                              )}
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </TabPanel>
            </Box>
          </Paper>
        </Grid>

        {/* Right Column - Contacts & Summary */}
        <Grid item xs={12} lg={4}>
          {/* Contacts */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom>
              Contacts
            </Typography>
            {contacts.length === 0 ? (
              <Typography color="text.secondary">No contacts added</Typography>
            ) : (
              contacts.map((contact) => (
                <Card key={contact.id} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent sx={{ pb: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <PersonIcon color="action" />
                      <Typography variant="subtitle2">
                        {contact.name}
                        {contact.is_primary && (
                          <Chip label="Primary" size="small" color="primary" sx={{ ml: 1 }} />
                        )}
                      </Typography>
                    </Box>
                    {contact.designation && (
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                        {contact.designation}
                      </Typography>
                    )}
                    {contact.emails?.map((email) => (
                      <Box key={email.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 4, mt: 0.5 }}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2">{email.email}</Typography>
                      </Box>
                    ))}
                    {contact.phones?.map((phone) => (
                      <Box key={phone.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 4, mt: 0.5 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">{phone.phone}</Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              ))
            )}
          </Paper>

          {/* Pending Tasks Summary */}
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom>
              Pending Tasks
            </Typography>
            {tasks.filter((t) => t.status !== 'completed').length === 0 ? (
              <Typography color="text.secondary">No pending tasks</Typography>
            ) : (
              tasks
                .filter((t) => t.status !== 'completed')
                .slice(0, 3)
                .map((task) => (
                  <Box key={task.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <TaskIcon color="action" fontSize="small" />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2">{task.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Due: {new Date(task.due_date).toLocaleDateString('en-IN')}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => handleCompleteTask(task.id)}>
                      <CheckCircleIcon fontSize="small" color="success" />
                    </IconButton>
                  </Box>
                ))
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Log Activity Dialog */}
      <Dialog open={activityDialogOpen} onClose={() => setActivityDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Log Activity</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Activity Type"
                value={newActivity.activity_type}
                onChange={(e) => setNewActivity({ ...newActivity, activity_type: e.target.value as ActivityType })}
              >
                {Object.values(ActivityType).map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Subject"
                value={newActivity.subject}
                onChange={(e) => setNewActivity({ ...newActivity, subject: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={newActivity.notes}
                onChange={(e) => setNewActivity({ ...newActivity, notes: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Outcome"
                value={newActivity.outcome}
                onChange={(e) => setNewActivity({ ...newActivity, outcome: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Duration (minutes)"
                value={newActivity.duration_minutes}
                onChange={(e) => setNewActivity({ ...newActivity, duration_minutes: parseInt(e.target.value) || 0 })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActivityDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleLogActivity} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={taskDialogOpen} onClose={() => setTaskDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Task</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Task Type"
                value={newTask.task_type}
                onChange={(e) => setNewTask({ ...newTask, task_type: e.target.value as TaskType })}
              >
                {Object.values(TaskType).map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="date"
                label="Due Date"
                InputLabelProps={{ shrink: true }}
                value={newTask.due_date}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                select
                label="Priority"
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
              >
                {Object.values(TaskPriority).map((priority) => (
                  <MenuItem key={priority} value={priority}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateTask} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Change Status Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Lead Status</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="New Status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                {[...LEAD_STATUS_ORDER, LeadStatus.LOST].map((status) => (
                  <MenuItem key={status} value={status} disabled={status === lead.lead_status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Notes (optional)"
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleChangeStatus} variant="contained" disabled={!newStatus}>
            Change Status
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
