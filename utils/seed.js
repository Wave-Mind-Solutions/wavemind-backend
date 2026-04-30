const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User.model");
const Requirement = require("../models/Requirement.model");
const Project = require("../models/Project.model");

const path = require("path");
dotenv.config({ path: path.join(__dirname, "../.env") });

const seedData = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error("MONGO_URI is not defined in server/.env");
    }
    await mongoose.connect(uri);
    console.log("Connected to MongoDB for seeding...");

    // Clear existing data (optional, but good for a fresh start)
    // await User.deleteMany({});
    // await Requirement.deleteMany({});
    // await Project.deleteMany({});

    const users = [
      {
        fullName: "Admin User",
        email: "admin@wavemind.com",
        password: "password123",
        role: "admin",
      },
      {
        fullName: "John Developer",
        email: "dev@wavemind.com",
        password: "password123",
        role: "developer",
        developerType: "web",
      },
      {
        fullName: "Jane Client",
        email: "client@wavemind.com",
        password: "password123",
        role: "client",
      },
    ];

    for (const u of users) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        await User.create(u);
        console.log(`Created user: ${u.fullName} (${u.role})`);
      } else {
        console.log(`User already exists: ${u.fullName}`);
      }
    }

    console.log("Seeding completed successfully!");
    process.exit();
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedData();
