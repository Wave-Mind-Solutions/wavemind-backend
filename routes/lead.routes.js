/**
 * WaveMind Solutions – Lead API Routes
 * POST /api/lead         – public (chatbot submission)
 * GET  /api/lead         – protected (admin paginated listing)
 * GET  /api/lead/export  – protected (admin Excel download)
 */

const express        = require('express');
const router         = express.Router();
const { submitLead, getLeads, exportLeadsExcel } = require('../controllers/lead.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// Public – chatbot lead capture (no auth required)
router.post('/', submitLead);

// Protected – admin only: paginated JSON list
router.get('/', authMiddleware, roleMiddleware('admin'), getLeads);

// Protected – admin only: Excel export download
// NOTE: /export must be registered BEFORE any /:id route to avoid path conflicts
router.get('/export', authMiddleware, roleMiddleware('admin'), exportLeadsExcel);

module.exports = router;

