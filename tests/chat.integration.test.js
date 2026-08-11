/**
 * Chat Integration & Security Test Runner
 * Verifies User-Specific Chat Storage, Guest Mode Statelessness, and IDOR Isolation
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const express = require("express");
const http = require("http");

// Load Environment Variables
require("dotenv").config();

const User = require("../models/User.model");
const ChatConversation = require("../models/ChatConversation.model");
const chatRoutes = require("../routes/chat.routes");

const JWT_SECRET = process.env.JWT_SECRET || "wavemind-secret-key-change-in-production";

// Setup Express Test App
const app = express();
app.use(express.json());
app.use("/api/chat", chatRoutes);

let server;
let BASE_URL;
let userA;
let tokenA;
let userB;
let tokenB;

test.before(async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/wavemind";
  await mongoose.connect(mongoUri);

  // Start HTTP test server on an ephemeral port
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  BASE_URL = `http://127.0.0.1:${port}/api/chat`;

  // Clean test fixtures
  await User.deleteMany({ email: { $in: ["chattest_userA@example.com", "chattest_userB@example.com"] } });

  // Create User A
  userA = await User.create({
    fullName: "Chat Test User A",
    email: "chattest_userA@example.com",
    password: "password123",
    role: "client",
    isVerified: true,
  });
  tokenA = jwt.sign({ id: userA._id }, JWT_SECRET, { expiresIn: "1h" });

  // Create User B
  userB = await User.create({
    fullName: "Chat Test User B",
    email: "chattest_userB@example.com",
    password: "password123",
    role: "client",
    isVerified: true,
  });
  tokenB = jwt.sign({ id: userB._id }, JWT_SECRET, { expiresIn: "1h" });

  // Clean conversations for these test users
  await ChatConversation.deleteMany({ userId: { $in: [userA._id, userB._id] } });
});

test.after(async () => {
  if (userA) await ChatConversation.deleteMany({ userId: { $in: [userA._id, userB._id] } });
  if (userA) await User.deleteMany({ email: { $in: ["chattest_userA@example.com", "chattest_userB@example.com"] } });
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
});

// ── TEST 1: Guest Mode Statelessness ─────────────────────────────────────────
test("TEST 1: Guest chat endpoint responds statelessly and creates 0 MongoDB documents", async () => {
  const initialCount = await ChatConversation.countDocuments();

  const res = await fetch(`${BASE_URL}/guest/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: "I want to build a portfolio website." }],
    }),
  });

  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.message.role, "assistant");
  assert.ok(body.message.content.length > 0);

  const finalCount = await ChatConversation.countDocuments();
  assert.equal(finalCount, initialCount, "Guest mode MUST NOT save any ChatConversation records to MongoDB");
});

// ── TEST 2: Authenticated Conversation Creation ──────────────────────────────
test("TEST 2: Authenticated User A creates conversation bound strictly to req.user._id", async () => {
  const res = await fetch(`${BASE_URL}/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ title: "User A E-commerce Inquiry" }),
  });

  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.userId.toString(), userA._id.toString());

  const dbConv = await ChatConversation.findById(body.data._id);
  assert.ok(dbConv);
  assert.equal(dbConv.userId.toString(), userA._id.toString());
});

// ── TEST 3: User A Messages Append & MongoDB Persistence ─────────────────────
test("TEST 3: User A sends message in conversation and receives AI response saved to MongoDB", async () => {
  const convRes = await fetch(`${BASE_URL}/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({}),
  });
  const convData = await convRes.json();
  const convId = convData.data._id;

  const msgRes = await fetch(`${BASE_URL}/conversations/${convId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ content: "What is the minimum budget for an e-commerce website?" }),
  });

  const msgData = await msgRes.json();
  assert.equal(msgRes.status, 200);
  assert.equal(msgData.success, true);
  assert.equal(msgData.userMessage.content, "What is the minimum budget for an e-commerce website?");
  assert.equal(msgData.assistantMessage.role, "assistant");

  // Verify MongoDB updated
  const updatedConv = await ChatConversation.findById(convId);
  assert.equal(updatedConv.messages.length, 2);
  assert.equal(updatedConv.messages[0].content, "What is the minimum budget for an e-commerce website?");
  assert.equal(updatedConv.messages[1].role, "assistant");
});

// ── TEST 4: User Isolation (User A Conversations) ───────────────────────────
test("TEST 4: User A GET /api/chat/conversations returns only User A conversations", async () => {
  const res = await fetch(`${BASE_URL}/conversations`, {
    method: "GET",
    headers: { Authorization: `Bearer ${tokenA}` },
  });

  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.ok(body.data.length >= 1);
  body.data.forEach((c) => {
    assert.equal(c.userId.toString(), userA._id.toString());
  });
});

// ── TEST 5: User Isolation (User B Receives 0 of User A's Conversations) ─────
test("TEST 5: User B GET /api/chat/conversations returns 0 of User A's conversations", async () => {
  const res = await fetch(`${BASE_URL}/conversations`, {
    method: "GET",
    headers: { Authorization: `Bearer ${tokenB}` },
  });

  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.length, 0, "User B must NOT see User A's conversations");
});

// ── TEST 6: IDOR Protection on GET /api/chat/conversations/:id ──────────────
test("TEST 6: User B attempting GET /api/chat/conversations/<User A Conv ID> receives 403 Forbidden", async () => {
  const convRes = await fetch(`${BASE_URL}/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({}),
  });
  const convData = await convRes.json();
  const userAConvId = convData.data._id;

  const res = await fetch(`${BASE_URL}/conversations/${userAConvId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${tokenB}` },
  });

  const body = await res.json();
  assert.equal(res.status, 403, "User B must be forbidden from accessing User A's conversation");
  assert.equal(body.success, false);
});

// ── TEST 7: IDOR Protection on POST /api/chat/conversations/:id/messages ─────
test("TEST 7: User B attempting POST /api/chat/conversations/<User A Conv ID>/messages receives 403 Forbidden", async () => {
  const convRes = await fetch(`${BASE_URL}/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({}),
  });
  const convData = await convRes.json();
  const userAConvId = convData.data._id;

  const res = await fetch(`${BASE_URL}/conversations/${userAConvId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({ content: "Unauthorized message attempt" }),
  });

  const body = await res.json();
  assert.equal(res.status, 403, "User B must be forbidden from appending to User A's conversation");
  assert.equal(body.success, false);
});

// ── TEST 8: IDOR Protection on DELETE /api/chat/conversations/:id ────────────
test("TEST 8: User B attempting DELETE /api/chat/conversations/<User A Conv ID> receives 403 Forbidden", async () => {
  const convRes = await fetch(`${BASE_URL}/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({}),
  });
  const convData = await convRes.json();
  const userAConvId = convData.data._id;

  const res = await fetch(`${BASE_URL}/conversations/${userAConvId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${tokenB}` },
  });

  const body = await res.json();
  assert.equal(res.status, 403, "User B must be forbidden from deleting User A's conversation");
  assert.equal(body.success, false);
});

// ── TEST 9: Authorized Deletion ──────────────────────────────────────────────
test("TEST 9: User A DELETE /api/chat/conversations/<User A Conv ID> succeeds", async () => {
  const convRes = await fetch(`${BASE_URL}/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({}),
  });
  const convData = await convRes.json();
  const userAConvId = convData.data._id;

  const res = await fetch(`${BASE_URL}/conversations/${userAConvId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${tokenA}` },
  });

  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);

  const check = await ChatConversation.findById(userAConvId);
  assert.equal(check, null, "Conversation should be deleted from MongoDB");
});
