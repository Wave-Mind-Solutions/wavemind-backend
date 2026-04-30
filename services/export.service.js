const { Parser } = require("json2csv");
const PDFDocument = require("pdfkit");

/**
 * Export Service
 * Handles CSV and PDF generation
 */

const generateCSV = (data, fields) => {
  const json2csvParser = new Parser({ fields });
  return json2csvParser.parse(data);
};

const generateProjectPDF = (project, res) => {
  const doc = new PDFDocument({ margin: 50 });

  // Stream directly to response
  doc.pipe(res);

  // Header
  doc.fillColor("#444444").fontSize(20).text("Project Report", { align: "center" });
  doc.moveDown();
  doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: "right" });
  doc.moveDown();

  // Project Info
  doc.fontSize(14).fillColor("#6c47ff").text("Project Details", { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12).fillColor("#000000").text(`Title: ${project.title}`);
  doc.text(`Status: ${project.status}`);
  doc.text(`Deadline: ${new Date(project.deadline).toLocaleDateString()}`);
  doc.text(`Description: ${project.description}`);
  doc.moveDown();

  // Footer
  doc.fontSize(10).fillColor("#888888").text("WaveMind Solutions | Confidential", 50, doc.page.height - 50, { align: "center" });

  doc.end();
};

module.exports = { generateCSV, generateProjectPDF };
