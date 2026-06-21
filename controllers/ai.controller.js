/**
 * AI Controller
 * Exposes AI endpoints securely
 */
const aiService = require("../services/ai.service");

const analyzeProject = async (req, res) => {
  const { title, description, budget, priority, techStack } = req.body;

  if (!description) {
    return res.status(400).json({
      success: false,
      message: "Project description is required for AI analysis.",
    });
  }

  try {
    const analysis = await aiService.analyzeProject({
      title,
      description,
      budget,
      priority,
      techStack,
    });

    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error("AI Analysis Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to analyze project with AI.",
    });
  }
};

module.exports = { analyzeProject };
