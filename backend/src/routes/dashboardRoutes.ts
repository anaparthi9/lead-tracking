import { Router } from 'express';
import {
  getDashboardOverview,
  getLeadSourceAnalytics,
  getSalesRepPerformance,
  getRecentActivities,
  getPipelineTrend,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '../controllers/dashboardController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Dashboard
router.get('/overview', getDashboardOverview);
router.get('/lead-sources', getLeadSourceAnalytics);
router.get('/sales-performance', getSalesRepPerformance);
router.get('/recent-activities', getRecentActivities);
router.get('/pipeline-trend', getPipelineTrend);

// Notifications
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);
router.put('/notifications/read-all', markAllNotificationsRead);

export default router;
