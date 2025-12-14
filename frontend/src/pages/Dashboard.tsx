import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
} from '@mui/material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  Whatshot as WhatshotIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Assignment as TaskIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { leadAPI, taskAPI, activityAPI } from '../services/api';
import type { Task, Activity } from '../types';
import { LeadStatus, LeadTemperature, ActivityType } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [pipelineData, setPipelineData] = useState<Array<{ status: string; count: number; value: number }>>([]);
  const [sourceData, setSourceData] = useState<Array<{ source: string; count: number }>>([]);
  const [temperatureData, setTemperatureData] = useState<Array<{ name: string; value: number }>>([]);
  const [stats, setStats] = useState({
    totalLeads: 0,
    pipelineValue: 0,
    hotLeads: 0,
    avgScore: 0,
    wonDeals: 0,
    lostDeals: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load leads
      const leadsResponse = await leadAPI.getAll({ limit: 1000 });
      const allLeads = leadsResponse.data;

      // Calculate stats
      const activeLeads = allLeads.filter(l => l.lead_status !== LeadStatus.WON && l.lead_status !== LeadStatus.LOST);
      const hotLeads = allLeads.filter(l => l.temperature === LeadTemperature.HOT && l.lead_status !== LeadStatus.WON && l.lead_status !== LeadStatus.LOST);
      const wonLeads = allLeads.filter(l => l.lead_status === LeadStatus.WON);
      const lostLeads = allLeads.filter(l => l.lead_status === LeadStatus.LOST);
      const totalValue = activeLeads.reduce((sum, l) => sum + (l.deal_size_estimate || 0), 0);
      const avgScore = activeLeads.length > 0
        ? Math.round(activeLeads.reduce((sum, l) => sum + l.lead_score, 0) / activeLeads.length)
        : 0;

      setStats({
        totalLeads: activeLeads.length,
        pipelineValue: totalValue,
        hotLeads: hotLeads.length,
        avgScore,
        wonDeals: wonLeads.length,
        lostDeals: lostLeads.length,
      });

      // Calculate pipeline data
      const pipelineStats: Record<string, { count: number; value: number }> = {};
      activeLeads.forEach(lead => {
        if (!pipelineStats[lead.lead_status]) {
          pipelineStats[lead.lead_status] = { count: 0, value: 0 };
        }
        pipelineStats[lead.lead_status].count++;
        pipelineStats[lead.lead_status].value += lead.deal_size_estimate || 0;
      });
      setPipelineData(
        Object.entries(pipelineStats).map(([status, data]) => ({
          status,
          count: data.count,
          value: data.value / 100000, // Convert to Lakhs
        }))
      );

      // Calculate source data
      const sourceStats: Record<string, number> = {};
      activeLeads.forEach(lead => {
        const source = lead.lead_source || 'Unknown';
        sourceStats[source] = (sourceStats[source] || 0) + 1;
      });
      setSourceData(
        Object.entries(sourceStats)
          .map(([source, count]) => ({ source, count }))
          .sort((a, b) => b.count - a.count)
      );

      // Calculate temperature data
      const tempStats: Record<string, number> = { Hot: 0, Warm: 0, Cold: 0 };
      activeLeads.forEach(lead => {
        tempStats[lead.temperature] = (tempStats[lead.temperature] || 0) + 1;
      });
      setTemperatureData(
        Object.entries(tempStats).map(([name, value]) => ({ name, value }))
      );

      // Load tasks
      try {
        const [overdueResponse, todayResponse] = await Promise.all([
          taskAPI.getOverdue(),
          taskAPI.getToday(),
        ]);
        setOverdueTasks(overdueResponse.data || []);
        setTodayTasks(todayResponse.data || []);
      } catch (e) {
        console.error('Failed to load tasks:', e);
      }

      // Load recent activities
      try {
        const activitiesResponse = await activityAPI.getAll({ limit: 10 });
        setRecentActivities(activitiesResponse.data || []);
      } catch (e) {
        console.error('Failed to load activities:', e);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `${(value / 10000000).toFixed(1)} Cr`;
    if (value >= 100000) return `${(value / 100000).toFixed(1)} L`;
    return `${value.toLocaleString('en-IN')}`;
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case ActivityType.PHONE_CALL: return <PhoneIcon color="primary" />;
      case ActivityType.EMAIL_SENT: return <EmailIcon color="info" />;
      case ActivityType.MEETING: return <PeopleIcon color="secondary" />;
      case ActivityType.SITE_VISIT: return <TrendingUpIcon color="success" />;
      default: return <TaskIcon color="action" />;
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await taskAPI.complete(taskId);
      loadData();
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
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
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 700 }}>
        Dashboard
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: '#FFFFFF',
            borderRadius: 4,
            border: '1px solid #e0e0e0',
            '&:hover': {
              borderColor: '#00C853',
              boxShadow: '0 4px 16px rgba(0, 200, 83, 0.12)',
              transform: 'translateY(-4px)',
            },
            transition: 'all 0.3s ease',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/leads')}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ color: '#666666', fontWeight: 600 }}>
                  Active Leads
                </Typography>
                <PeopleIcon sx={{ color: '#00C853' }} />
              </Box>
              <Typography variant="h2" sx={{ fontWeight: 700, mb: 1, color: '#00C853' }}>
                {stats.totalLeads}
              </Typography>
              <Typography variant="body2" sx={{ color: '#999999' }}>
                In pipeline
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: '#FFFFFF',
            borderRadius: 4,
            border: '1px solid #e0e0e0',
            '&:hover': {
              borderColor: '#00C853',
              boxShadow: '0 4px 16px rgba(0, 200, 83, 0.12)',
              transform: 'translateY(-4px)',
            },
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ color: '#666666', fontWeight: 600 }}>
                  Pipeline Value
                </Typography>
                <MoneyIcon sx={{ color: '#00C853' }} />
              </Box>
              <Typography variant="h2" sx={{ fontWeight: 700, mb: 1, color: '#00C853' }}>
                {formatCurrency(stats.pipelineValue)}
              </Typography>
              <Typography variant="body2" sx={{ color: '#999999' }}>
                Total estimated value
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: '#FFFFFF',
            borderRadius: 4,
            border: '1px solid #e0e0e0',
            '&:hover': {
              borderColor: '#f44336',
              boxShadow: '0 4px 16px rgba(244, 67, 54, 0.12)',
              transform: 'translateY(-4px)',
            },
            transition: 'all 0.3s ease',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/pipeline')}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ color: '#666666', fontWeight: 600 }}>
                  Hot Leads
                </Typography>
                <WhatshotIcon sx={{ color: '#f44336' }} />
              </Box>
              <Typography variant="h2" sx={{ fontWeight: 700, mb: 1, color: '#f44336' }}>
                {stats.hotLeads}
              </Typography>
              <Typography variant="body2" sx={{ color: '#999999' }}>
                Requires immediate attention
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: '#FFFFFF',
            borderRadius: 4,
            border: '1px solid #e0e0e0',
            '&:hover': {
              borderColor: '#00C853',
              boxShadow: '0 4px 16px rgba(0, 200, 83, 0.12)',
              transform: 'translateY(-4px)',
            },
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ color: '#666666', fontWeight: 600 }}>
                  Avg Lead Score
                </Typography>
                <TrendingUpIcon sx={{ color: '#00C853' }} />
              </Box>
              <Typography variant="h2" sx={{ fontWeight: 700, mb: 1, color: '#00C853' }}>
                {stats.avgScore}
              </Typography>
              <Typography variant="body2" sx={{ color: '#999999' }}>
                Out of 100
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Pipeline by Status Chart */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Pipeline by Status
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis dataKey="status" fontSize={12} stroke="#666666" />
                <YAxis yAxisId="left" stroke="#666666" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="#666666" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E0E0E0', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '14px' }} />
                <Bar yAxisId="left" dataKey="count" fill="#00C853" name="Count" />
                <Bar yAxisId="right" dataKey="value" fill="#5efc82" name="Value (L)" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Temperature Distribution */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Lead Temperature
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={temperatureData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {temperatureData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.name === 'Hot' ? '#f44336' :
                        entry.name === 'Warm' ? '#ff9800' : '#90a4ae'
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Tasks Section */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Tasks
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {overdueTasks.length > 0 && (
                  <Chip
                    icon={<WarningIcon />}
                    label={`${overdueTasks.length} Overdue`}
                    color="error"
                    size="small"
                  />
                )}
                {todayTasks.length > 0 && (
                  <Chip
                    icon={<ScheduleIcon />}
                    label={`${todayTasks.length} Today`}
                    color="warning"
                    size="small"
                  />
                )}
              </Box>
            </Box>
            <List dense>
              {overdueTasks.slice(0, 3).map((task) => (
                <ListItem
                  key={task.id}
                  sx={{ backgroundColor: '#ffebee', borderRadius: 2, mb: 1 }}
                  secondaryAction={
                    <IconButton size="small" onClick={() => handleCompleteTask(task.id)}>
                      <CheckCircleIcon color="success" />
                    </IconButton>
                  }
                >
                  <ListItemIcon>
                    <WarningIcon color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary={task.title}
                    secondary={`${task.lead_company_name || 'No lead'} | Due: ${new Date(task.due_date).toLocaleDateString('en-IN')}`}
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItem>
              ))}
              {todayTasks.slice(0, 3).map((task) => (
                <ListItem
                  key={task.id}
                  sx={{ backgroundColor: '#fff3e0', borderRadius: 2, mb: 1 }}
                  secondaryAction={
                    <IconButton size="small" onClick={() => handleCompleteTask(task.id)}>
                      <CheckCircleIcon color="success" />
                    </IconButton>
                  }
                >
                  <ListItemIcon>
                    <ScheduleIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary={task.title}
                    secondary={`${task.lead_company_name || 'No lead'} | Due today`}
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItem>
              ))}
              {overdueTasks.length === 0 && todayTasks.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="No pending tasks"
                    secondary="All caught up!"
                    sx={{ textAlign: 'center' }}
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Recent Activities
            </Typography>
            <List dense>
              {recentActivities.slice(0, 5).map((activity) => (
                <ListItem key={activity.id} sx={{ borderRadius: 2, mb: 0.5 }}>
                  <ListItemIcon>
                    {getActivityIcon(activity.activity_type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={activity.subject || activity.activity_type.replace('_', ' ')}
                    secondary={`${activity.lead_company_name || 'No lead'} | ${new Date(activity.activity_date).toLocaleDateString('en-IN')}`}
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItem>
              ))}
              {recentActivities.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="No recent activities"
                    secondary="Log some activities to see them here"
                    sx={{ textAlign: 'center' }}
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Lead Sources Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Leads by Source
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sourceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis type="number" stroke="#666666" fontSize={12} />
                <YAxis dataKey="source" type="category" width={120} stroke="#666666" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E0E0E0', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#00C853" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Won/Lost Summary */}
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Closed Deals
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#e8f5e9', borderRadius: 2 }}>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: '#4caf50' }}>
                    {stats.wonDeals}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Won
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#ffebee', borderRadius: 2 }}>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: '#f44336' }}>
                    {stats.lostDeals}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Lost
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            {(stats.wonDeals + stats.lostDeals) > 0 && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  Win Rate: {((stats.wonDeals / (stats.wonDeals + stats.lostDeals)) * 100).toFixed(1)}%
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Quick Actions
            </Typography>
            <List>
              <ListItem
                button
                onClick={() => navigate('/leads')}
                sx={{ borderRadius: 2, mb: 1, '&:hover': { backgroundColor: '#e8f5e9' } }}
              >
                <ListItemIcon><PeopleIcon color="primary" /></ListItemIcon>
                <ListItemText primary="View All Leads" />
                <ArrowForwardIcon color="action" />
              </ListItem>
              <ListItem
                button
                onClick={() => navigate('/pipeline')}
                sx={{ borderRadius: 2, mb: 1, '&:hover': { backgroundColor: '#e8f5e9' } }}
              >
                <ListItemIcon><TrendingUpIcon color="primary" /></ListItemIcon>
                <ListItemText primary="View Pipeline" />
                <ArrowForwardIcon color="action" />
              </ListItem>
              <ListItem
                button
                onClick={() => navigate('/leads?temperature=Hot')}
                sx={{ borderRadius: 2, mb: 1, '&:hover': { backgroundColor: '#ffebee' } }}
              >
                <ListItemIcon><WhatshotIcon sx={{ color: '#f44336' }} /></ListItemIcon>
                <ListItemText primary="Hot Leads" />
                <ArrowForwardIcon color="action" />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
