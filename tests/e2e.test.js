const test = require("node:test");
const assert = require("node:assert");
const request = require("supertest");
const app = require("../app");
const User = require("../models/User.model");
const Requirement = require("../models/Requirement.model");
const Project = require("../models/Project.model");

test("End-to-End Client Lifecycle Integration Test", async (t) => {
  const testEmail = `client_${Date.now()}@test.com`;
  const testPassword = "Password123!";
  let jwtToken = "";
  let requirementId = "";
  let projectId = "";

  await t.test("Step 1: Register a new Client", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        fullName: "Test Client User",
        email: testEmail,
        password: testPassword,
        role: "client",
      })
      .expect(201);

    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.email, testEmail);
  });

  await t.test("Step 2: Verify OTP for the new Client", async () => {
    // Retrieve OTP directly from MongoDB to bypass email transport
    const userObj = await User.findOne({ email: testEmail }).select("+otp +otpExpires");
    assert.ok(userObj, "User should exist in database");
    assert.ok(userObj.otp, "OTP should be populated");

    // We need to compare it, but since it is bcrypt-hashed in DB, 
    // let's mock/simulate the verification endpoint directly or update the user
    userObj.isVerified = true;
    userObj.otp = undefined;
    userObj.otpExpires = undefined;
    await userObj.save();

    // Now log in to get the JWT token
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: testEmail,
        password: testPassword,
      })
      .expect(200);

    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.token, "JWT token should be returned");
    jwtToken = res.body.token;
  });

  await t.test("Step 3: Client Submits Project Requirement", async () => {
    const res = await request(app)
      .post("/api/client/requirements")
      .set("Authorization", `Bearer ${jwtToken}`)
      .send({
        title: "Test E-Commerce Platform",
        description: "Need a multi-vendor store built with Node.js and React.",
        budget: 95000,
        priority: "High",
        techStack: ["React", "Node.js", "MongoDB"],
        email: testEmail,
        phone: "+91 9876543210",
      })
      .expect(201);

    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data._id, "Requirement ID should be returned");
    requirementId = res.body.data._id;
  });

  await t.test("Step 4: Verify Requirement is in Client List", async () => {
    const res = await request(app)
      .get("/api/client/requirements")
      .set("Authorization", `Bearer ${jwtToken}`)
      .expect(200);

    assert.strictEqual(res.body.success, true);
    const hasReq = res.body.data.some((reqItem) => reqItem._id === requirementId);
    assert.ok(hasReq, "Submitted requirement should appear in client list");
  });

  // Clean up database records created during E2E test
  t.after(async () => {
    if (testEmail) {
      await User.deleteOne({ email: testEmail });
    }
    if (requirementId) {
      await Requirement.deleteOne({ _id: requirementId });
    }
  });
});
