/**
 * Projects Integration Test Suite
 * Tests the full E2E flow:
 *   Register → Login → Submit Project → Verify in MongoDB → Admin Views → Status Update → Client Sees Update
 *
 * Run: node --test server/tests/projects.integration.test.js
 * Requires: MONGO_URI in server/.env and a running MongoDB connection
 */
require("dotenv").config({ path: __dirname + "/../.env" });

// DNS override (same as server.js)
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

require("express-async-errors");

const test = require("node:test");
const assert = require("node:assert");
const request = require("supertest");
const app = require("../app");
const connectDB = require("../config/db");
const User = require("../models/User.model");
const Project = require("../models/Project.model");

// ── Helpers ────────────────────────────────────────────────────────────────
const TEST_CLIENT_EMAIL = `proj_test_client_${Date.now()}@wavemindtest.com`;
const TEST_ADMIN_EMAIL = `proj_test_admin_${Date.now()}@wavemindtest.com`;
const TEST_PASSWORD = "TestPassword123!";

let clientToken = "";
let adminToken = "";
let createdProjectId = "";

// ── Main Test Suite ────────────────────────────────────────────────────────
test("Projects Full E2E Integration", async (t) => {
  // Connect to MongoDB before tests
  await connectDB();

  // ── Test 1: Register client ──────────────────────────────────────────────
  await t.test("1. Register client user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ fullName: "Test Client", email: TEST_CLIENT_EMAIL, password: TEST_PASSWORD, role: "client" })
      .expect(201);

    assert.strictEqual(res.body.success, true, "Registration should succeed");

    // Bypass OTP for testing
    const user = await User.findOne({ email: TEST_CLIENT_EMAIL });
    assert.ok(user, "User should be created in MongoDB");
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
  });

  // ── Test 2: Register admin ───────────────────────────────────────────────
  await t.test("2. Register admin user", async () => {
    const adminUser = await User.create({
      fullName: "Test Admin",
      email: TEST_ADMIN_EMAIL,
      password: require("bcryptjs").hashSync(TEST_PASSWORD, 10),
      role: "admin",
      isVerified: true,
      isActive: true,
    });
    assert.ok(adminUser._id, "Admin should be created in MongoDB");
  });

  // ── Test 3: Client Login ─────────────────────────────────────────────────
  await t.test("3. Client login returns JWT", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_CLIENT_EMAIL, password: TEST_PASSWORD })
      .expect(200);

    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.token, "JWT should be returned");
    clientToken = res.body.token;
  });

  // ── Test 4: Admin Login ──────────────────────────────────────────────────
  await t.test("4. Admin login returns JWT", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_ADMIN_EMAIL, password: TEST_PASSWORD })
      .expect(200);

    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.token, "Admin JWT should be returned");
    adminToken = res.body.token;
  });

  // ── Test 5: Client submits project via POST /api/projects ────────────────
  await t.test("5. Client submits project — saved to MongoDB", async () => {
    const res = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${clientToken}`)
      .send({
        title: "Test E2E Portfolio Website",
        projectType: "Portfolio",
        businessIndustry: "Photography",
        requiredFeatures: ["Portfolio Gallery", "Contact Form"],
        designRequirement: "Custom Design",
        budget: 15000,  // Min for portfolio
        timeline: "Within 2 months",
        description: "A professional photography portfolio",
        email: TEST_CLIENT_EMAIL,
        phone: "9876543210",
      })
      .expect(201);

    assert.strictEqual(res.body.success, true, "Submit should succeed");
    assert.ok(res.body.project._id, "MongoDB _id should be returned");
    assert.strictEqual(res.body.project.status, "In Review", "Status should be 'In Review'");
    assert.strictEqual(res.body.project.progress, 0, "Progress should be 0");

    createdProjectId = res.body.project._id;

    // Verify directly in MongoDB
    const dbProject = await Project.findById(createdProjectId);
    assert.ok(dbProject, "Project MUST exist in MongoDB — not just in memory");
    assert.strictEqual(dbProject.status, "In Review");
    assert.strictEqual(String(dbProject.clientId), String((await User.findOne({ email: TEST_CLIENT_EMAIL }))._id));
  });

  // ── Test 6: Budget below minimum is rejected ─────────────────────────────
  await t.test("6. Budget below minimum is rejected with 400", async () => {
    const res = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${clientToken}`)
      .send({
        title: "Cheap Portfolio",
        projectType: "Portfolio",
        budget: 5000,  // Below ₹10,000 minimum
        description: "Test",
        phone: "9876543210",
        email: TEST_CLIENT_EMAIL,
      })
      .expect(400);

    assert.strictEqual(res.body.success, false, "Low budget should be rejected");
    assert.ok(res.body.message, "Error message should be present");
  });

  // ── Test 7: Unauthenticated request is rejected ──────────────────────────
  await t.test("7. Unauthenticated project submission returns 401", async () => {
    const res = await request(app)
      .post("/api/projects")
      .send({ title: "Unauthorized Project", budget: 30000, projectType: "Portfolio" })
      .expect(401);

    assert.strictEqual(res.body.success, false);
  });

  // ── Test 8: Client can see their project via GET /api/projects ───────────
  await t.test("8. Client sees their project in GET /api/projects", async () => {
    const res = await request(app)
      .get("/api/projects")
      .set("Authorization", `Bearer ${clientToken}`)
      .expect(200);

    assert.strictEqual(res.body.success, true);
    const found = (res.body.projects || res.body.data || []).some(
      (p) => p._id === createdProjectId
    );
    assert.ok(found, "Created project should appear in client project list from MongoDB");
  });

  // ── Test 9: IDOR — client cannot access another client's project ─────────
  await t.test("9. IDOR protection — client cannot access another client's project", async () => {
    // Create a second client
    const otherEmail = `other_${Date.now()}@wavemindtest.com`;
    const otherUser = await User.create({
      fullName: "Other Client",
      email: otherEmail,
      password: require("bcryptjs").hashSync(TEST_PASSWORD, 10),
      role: "client",
      isVerified: true,
      isActive: true,
    });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: otherEmail, password: TEST_PASSWORD })
      .expect(200);
    const otherToken = loginRes.body.token;

    // Other client tries to access first client's project
    const res = await request(app)
      .get(`/api/projects/${createdProjectId}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .expect(403);

    assert.strictEqual(res.body.success, false, "IDOR should be prevented");

    // Cleanup
    await User.deleteOne({ email: otherEmail });
  });

  // ── Test 10: Admin sees the project ─────────────────────────────────────
  await t.test("10. Admin sees project in GET /api/admin/projects", async () => {
    const res = await request(app)
      .get("/api/admin/projects")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    assert.strictEqual(res.body.success, true);
    const found = (res.body.data || []).some((p) => p._id === createdProjectId);
    assert.ok(found, "Admin should see the submitted project from MongoDB");
  });

  // ── Test 11: Admin stats endpoint returns real data ──────────────────────
  await t.test("11. GET /api/admin/projects/stats returns aggregated stats", async () => {
    const res = await request(app)
      .get("/api/admin/projects/stats")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    assert.strictEqual(res.body.success, true);
    assert.ok(typeof res.body.stats.totalProjects === "number", "totalProjects should be a number");
    assert.ok(typeof res.body.stats.inReview === "number", "inReview should be a number");
    assert.ok(res.body.stats.inReview >= 1, "At least 1 project should be In Review");
  });

  // ── Test 12: Admin updates project status ────────────────────────────────
  await t.test("12. Admin updates project status to Approved + progress 20", async () => {
    const res = await request(app)
      .patch(`/api/admin/projects/${createdProjectId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "Approved", progress: 20, adminNotes: "Reviewed by QA team" })
      .expect(200);

    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.status, "Approved");
    assert.strictEqual(res.body.data.progress, 20);

    // Verify in MongoDB directly
    const dbProject = await Project.findById(createdProjectId);
    assert.strictEqual(dbProject.status, "Approved", "MongoDB status must be Approved");
    assert.strictEqual(dbProject.progress, 20, "MongoDB progress must be 20");
  });

  // ── Test 13: Client sees updated status (cross-dashboard sync) ───────────
  await t.test("13. Client sees updated status from MongoDB (cross-dashboard sync)", async () => {
    const res = await request(app)
      .get(`/api/projects/${createdProjectId}`)
      .set("Authorization", `Bearer ${clientToken}`)
      .expect(200);

    assert.strictEqual(res.body.success, true);
    const p = res.body.project || res.body.data;
    assert.strictEqual(p.status, "Approved", "Client should see Approved status from DB");
    assert.strictEqual(p.progress, 20, "Client should see 20% progress from DB");
    assert.strictEqual(p.adminNotes, "Reviewed by QA team");
  });

  // ── Test 14: Completed status auto-sets progress to 100 ─────────────────
  await t.test("14. Setting status=Completed auto-sets progress=100", async () => {
    const res = await request(app)
      .patch(`/api/admin/projects/${createdProjectId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "Completed" })
      .expect(200);

    assert.strictEqual(res.body.data.status, "Completed");
    assert.strictEqual(res.body.data.progress, 100, "Completed should auto-set progress to 100");
  });

  // ── Test 15: Client project stats endpoint ───────────────────────────────
  await t.test("15. GET /api/projects/stats returns client-scoped stats", async () => {
    const res = await request(app)
      .get("/api/projects/stats")
      .set("Authorization", `Bearer ${clientToken}`)
      .expect(200);

    assert.strictEqual(res.body.success, true);
    assert.ok(typeof res.body.stats.totalProjects === "number");
    assert.ok(res.body.stats.totalProjects >= 1);
  });

  // ── Cleanup ──────────────────────────────────────────────────────────────
  t.after(async () => {
    console.log("\n[CLEANUP] Removing test data from MongoDB...");
    await User.deleteOne({ email: TEST_CLIENT_EMAIL });
    await User.deleteOne({ email: TEST_ADMIN_EMAIL });
    await Project.deleteOne({ _id: createdProjectId });
    console.log("[CLEANUP] Done.");
    process.exit(0);
  });
});
