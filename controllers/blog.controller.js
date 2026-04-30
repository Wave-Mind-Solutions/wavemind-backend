const Post = require("../models/Post.model");

const getAllPosts = async (req, res) => {
  const posts = await Post.find({ isPublished: true }).populate("author", "fullName");
  res.status(200).json({ success: true, data: posts });
};

const createPost = async (req, res) => {
  const { title, content, category, seo, tags } = req.body;
  const slug = title.toLowerCase().replace(/ /g, "-");
  const post = await Post.create({
    title, slug, content, category, seo, tags, author: req.user._id
  });
  res.status(201).json({ success: true, data: post });
};

module.exports = { getAllPosts, createPost };
