const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tags: [String],
    image: String,
    category: { type: String, enum: ["Case Study", "Blog", "Announcement"], default: "Blog" },
    isPublished: { type: Boolean, default: false },
    seo: {
      title: String,
      description: String,
      keywords: [String],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);
