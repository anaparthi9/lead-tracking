import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getActivities,
  getLeadActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
  addAttachment,
  getActivityTypes
} from '../controllers/activityController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Activity types (for dropdowns)
router.get('/types', getActivityTypes);

// CRUD operations
router.get('/', getActivities);
router.get('/:id', getActivity);
router.post('/', createActivity);
router.put('/:id', updateActivity);
router.delete('/:id', deleteActivity);

// Get activities for a specific lead
router.get('/lead/:leadId', getLeadActivities);

// Attachments
router.post('/:id/attachments', addAttachment);

export default router;
