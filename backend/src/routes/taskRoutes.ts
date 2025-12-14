import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getTasks,
  getTodayTasks,
  getOverdueTasks,
  getTask,
  createTask,
  updateTask,
  completeTask,
  deleteTask,
  getTaskStats,
  getTaskTypes
} from '../controllers/taskController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Task options (for dropdowns)
router.get('/types', getTaskTypes);

// Task stats
router.get('/stats', getTaskStats);

// Special views
router.get('/today', getTodayTasks);
router.get('/overdue', getOverdueTasks);

// CRUD operations
router.get('/', getTasks);
router.get('/:id', getTask);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

// Complete task
router.put('/:id/complete', completeTask);

export default router;
