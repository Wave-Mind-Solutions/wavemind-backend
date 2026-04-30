/**
 * Deliverable Model
 * Files uploaded by developers for a task/project
 */
const mongoose = require("mongoose");

const deliverableSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: [true, "Task ID is required"],
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project ID is required"],
    },
    fileName: {
      type: String,
      required: [true, "File name is required"],
    },
    fileUrl: {
      type: String,
      required: [true, "File URL is required"],
    },
    publicId: {
      type: String, // Cloudinary public_id for deletion
      default: "",
    },
    fileType: {
      type: String,
      enum: ["code", "design", "report"],
      required: [true, "File type is required"],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Deliverable", deliverableSchema);
