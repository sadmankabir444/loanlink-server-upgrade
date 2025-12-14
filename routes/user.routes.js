const express = require("express");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const verifyToken = require("../middleware/verifyToken");

function userRoutes(db) {
  const router = express.Router();
  const userCollection = db.collection("users");

  // =============================
  // 1. Register / Create User
  // =============================
  router.post("/register", async (req, res) => {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required" });
      }

      const exists = await userCollection.findOne({ email });
      if (exists) {
        return res.status(400).json({ success: false, message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = {
        name,
        email,
        password: hashedPassword,
        role: role || "borrower",
        suspended: false,
        createdAt: new Date(),
      };

      const result = await userCollection.insertOne(newUser);

      res.status(201).json({ success: true, message: "User registered successfully", id: result.insertedId });
    } catch (error) {
      console.error("Register User Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // =============================
  // 2. Login
  // =============================
  router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email & password required" });
      }

      const user = await userCollection.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: "Invalid password" });

      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        "SECRET_KEY_123",
        { expiresIn: "7d" }
      );

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Login Error:", error);
      res.status(500).json({ message: "Login failed", error: error.message });
    }
  });

  // =============================
  // 3. Get All Users (Admin only)
  // =============================
  router.get("/", verifyToken, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admins only." });
      }

      const users = await userCollection.find().toArray();
      res.json({ success: true, count: users.length, users });
    } catch (error) {
      console.error("Fetch Users Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // =============================
  // 4. Get Single User by Email
  // =============================
  router.get("/:email", verifyToken, async (req, res) => {
    try {
      const email = req.params.email;
      const user = await userCollection.findOne({ email });

      if (!user) return res.status(404).json({ success: false, message: "User not found" });

      res.json({ success: true, user });
    } catch (error) {
      console.error("Get User Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // =============================
  // 5. Update User Role (Admin only)
  // =============================
  router.patch("/role/:id", verifyToken, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admins only." });
      }

      const id = req.params.id;
      const { role } = req.body;

      const result = await userCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { role } }
      );

      res.json({ success: true, message: "User role updated", result });
    } catch (error) {
      console.error("Update User Role Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // =============================
  // 6. Suspend / Update User
  // =============================
  router.patch("/suspend/:id", verifyToken, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admins only." });
      }

      const id = req.params.id;
      const updateData = req.body; // e.g., { suspended: true, reason: "Violation" }

      const result = await userCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      res.json({ success: true, message: "User updated successfully", result });
    } catch (error) {
      console.error("Suspend User Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // =============================
  // 7. Get Logged-in Profile
  // =============================
  router.get("/profile/me", verifyToken, async (req, res) => {
    try {
      const user = await userCollection.findOne({ _id: new ObjectId(req.user.id) });
      if (!user) return res.status(404).json({ message: "User not found" });

      res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          photoURL: user.photoURL || "",
        },
      });
    } catch (error) {
      console.error("Profile Fetch Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}

module.exports = userRoutes;
