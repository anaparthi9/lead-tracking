import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import {
  login,
  getCurrentUser,
  register,
  listUsers,
  updateUser
} from '../controllers/authController';

const router = Router();

// Public routes
router.post('/login', login);
router.post('/register', register);

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);

// User management (requires auth)
router.get('/users', authenticateToken, listUsers);
router.put('/users/:id', authenticateToken, requireAdmin, updateUser);

export default router;
