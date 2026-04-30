const Feedback = require("../models/Feedback.model");

const submitFeedback = async (req, res) => {
  const { projectId, rating, comment, isPublic } = req.body;
  const feedback = await Feedback.create({
    projectId,
    clientId: req.user._id,
    rating,
    comment,
    isPublic: isPublic || false,
  });
  res.status(201).json({ success: true, data: feedback });
};

const getProjectFeedback = async (req, res) => {
  const feedback = await Feedback.find({ projectId: req.params.projectId }).populate("clientId", "fullName avatar");
  res.status(200).json({ success: true, data: feedback });
};

module.exports = { submitFeedback, getProjectFeedback };
