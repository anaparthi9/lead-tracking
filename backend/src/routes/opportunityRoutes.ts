import { Router } from 'express';
import {
  getOpportunities,
  getOpportunityById,
  createOpportunity,
  updateOpportunity,
  changeOpportunityStage,
  addNote,
  getOpportunityHistory
} from '../controllers/opportunityController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getOpportunities);
router.get('/:id', getOpportunityById);
router.post('/', createOpportunity);
router.put('/:id', updateOpportunity);
router.post('/:id/change-stage', changeOpportunityStage);
router.post('/:id/notes', addNote);
router.get('/:id/history', getOpportunityHistory);

export default router;
