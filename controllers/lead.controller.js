/**
 * WaveMind Solutions – Lead Controller
 * Handles chatbot lead submission, admin retrieval, and Excel export
 */

const Lead    = require('../models/Lead.model');
const ExcelJS = require('exceljs');
const { PassThrough } = require('stream');

/* ─────────────────────────────────────────────
 * POST /api/lead
 * Body: { name, contact, requirement }
 * ───────────────────────────────────────────── */
const submitLead = async (req, res) => {
  const { name, contact, requirement } = req.body;

  // ── Manual validation ──────────────────────────────────────────────────────
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters.');
  }

  if (!contact || typeof contact !== 'string' || contact.trim().length < 3) {
    errors.push('A valid email address or phone number is required.');
  }

  if (!requirement || typeof requirement !== 'string' || requirement.trim().length < 5) {
    errors.push('Please describe your requirement (minimum 5 characters).');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors,
    });
  }

  // ── Persist to MongoDB ─────────────────────────────────────────────────────
  const lead = await Lead.create({
    name: name.trim(),
    contact: contact.trim(),
    requirement: requirement.trim(),
    source: 'chatbot',
  });

  return res.status(201).json({
    success: true,
    message: 'Lead captured successfully. Our team will be in touch soon!',
    data: {
      id: lead._id,
      name: lead.name,
      createdAt: lead.createdAt,
    },
  });
};

/* ─────────────────────────────────────────────
 * GET /api/lead
 * Admin-only paginated listing
 * ───────────────────────────────────────────── */
const getLeads = async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip  = (page - 1) * limit;

  const [leads, total] = await Promise.all([
    Lead.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Lead.countDocuments(),
  ]);

  return res.status(200).json({
    success: true,
    data: leads,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
};

/* ─────────────────────────────────────────────
 * GET /api/lead/export
 * Admin-only – streams an Excel (.xlsx) file containing
 * all lead records sorted by newest first.
 *
 * Uses ExcelJS streaming writer + Node PassThrough so
 * nothing is buffered to disk – safe for large datasets.
 * ───────────────────────────────────────────── */
const exportLeadsExcel = async (req, res) => {
  // ── 1. Fetch all leads (newest first) ─────────────────────────────────────
  const leads = await Lead.find()
    .sort({ createdAt: -1 })
    .lean();                       // plain JS objects – faster, less memory

  // ── 2. Set HTTP headers ────────────────────────────────────────────────────
  const filename = `leads_export_${Date.now()}.xlsx`;
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${filename}"`
  );

  // ── 3. Create workbook with streaming writer ───────────────────────────────
  //    PassThrough bridges the ExcelJS stream to the HTTP response.
  const passThrough = new PassThrough();
  const workbook    = new ExcelJS.stream.xlsx.WorkbookWriter({
    stream: passThrough,
    useStyles: true,
    useSharedStrings: true,
  });

  passThrough.pipe(res);

  // ── 4. Build worksheet ─────────────────────────────────────────────────────
  const sheet = workbook.addWorksheet('Leads', {
    views: [{ state: 'frozen', ySplit: 1 }],   // freeze header row
    pageSetup: { fitToPage: true, orientation: 'landscape' },
  });

  // ── 4a. Column definitions (sets width + key used in addRow) ──────────────
  sheet.columns = [
    { header: 'S.No',        key: 'sno',         width: 8  },
    { header: 'Name',        key: 'name',         width: 25 },
    { header: 'Contact',     key: 'contact',      width: 30 },
    { header: 'Requirement', key: 'requirement',  width: 55 },
    { header: 'Status',      key: 'status',       width: 14 },
    { header: 'Source',      key: 'source',       width: 14 },
    { header: 'Date',        key: 'date',         width: 22 },
  ];

  // ── 4b. Style the header row ───────────────────────────────────────────────
  const HEADER_FILL = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3B5BDB' },   // indigo-600 to match WaveMind brand
  };
  const HEADER_FONT = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  const BORDER_STYLE = {
    top:    { style: 'thin', color: { argb: 'FFD1D5DB' } },
    left:   { style: 'thin', color: { argb: 'FFD1D5DB' } },
    bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    right:  { style: 'thin', color: { argb: 'FFD1D5DB' } },
  };

  sheet.getRow(1).eachCell((cell) => {
    cell.fill      = HEADER_FILL;
    cell.font      = HEADER_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border    = BORDER_STYLE;
  });
  sheet.getRow(1).height = 30;

  // ── 4c. Handle empty database gracefully ───────────────────────────────────
  if (leads.length === 0) {
    const emptyRow = sheet.addRow({ sno: '', name: 'No leads found', contact: '', requirement: '', status: '', source: '', date: '' });
    emptyRow.getCell('name').font = { italic: true, color: { argb: 'FF6B7280' } };
    emptyRow.commit();
  }

  // ── 4d. Data rows ──────────────────────────────────────────────────────────
  const ALT_FILL = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF0F4FF' },   // light blue-tint for alternating rows
  };

  leads.forEach((lead, idx) => {
    const row = sheet.addRow({
      sno:         idx + 1,
      name:        lead.name         || '—',
      contact:     lead.contact      || '—',
      requirement: lead.requirement  || '—',
      status:      lead.status       || 'new',
      source:      lead.source       || 'chatbot',
      date: lead.createdAt
        ? new Date(lead.createdAt).toLocaleString('en-IN', {
            day:    '2-digit',
            month:  'short',
            year:   'numeric',
            hour:   '2-digit',
            minute: '2-digit',
            hour12: true,
          })
        : '—',
    });

    // Alternate row background for readability
    if (idx % 2 !== 0) {
      row.eachCell((cell) => { cell.fill = ALT_FILL; });
    }

    // Wrap long requirement text
    row.getCell('requirement').alignment = { wrapText: true, vertical: 'top' };
    row.getCell('sno').alignment         = { horizontal: 'center' };

    row.eachCell((cell) => { cell.border = BORDER_STYLE; });
    row.commit();                      // flush row to stream immediately
  });

  // ── 5. Commit workbook and end stream ──────────────────────────────────────
  await workbook.commit();
  // PassThrough 'end' is emitted automatically; res finishes when pipe drains
};

module.exports = { submitLead, getLeads, exportLeadsExcel };

