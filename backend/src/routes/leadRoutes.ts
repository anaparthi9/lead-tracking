import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getLeads,
  getLead,
  createLead,
  updateLead,
  updateLeadStatus,
  assignLead,
  addContact,
  recalculateScore,
  deleteLead,
  getLeadOptions,
  getPipelineSummary
} from '../controllers/leadController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Lead options (for dropdowns)
router.get('/options', getLeadOptions);

// Pipeline summary
router.get('/pipeline', getPipelineSummary);

// CRUD operations
router.get('/', getLeads);
router.get('/:id', getLead);
router.post('/', createLead);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);

// Status and assignment
router.put('/:id/status', updateLeadStatus);
router.put('/:id/assign', assignLead);

// Contacts
router.post('/:id/contacts', addContact);

// Scoring
router.get('/:id/score', recalculateScore);

export default router;
