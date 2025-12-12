const express = require("express");
const { ObjectId } = require("mongodb");

function userRoutes(db) {
  const router = express.Router();
  const userCollection = db.collection("users");

  // =============================
  // 1. Register / Save User (Basic)
  // =============================
  router.post("/", async (req, res) => {
    try {
      const user = req.body;

      // Check if user already exists
      const exists = await userCollection.findOne({ email: user.email });

      if (exists) {
        return res.json({
          success: false,
          message: "User already exists",
        });
      }

      // Default role = borrower (will update from dashboard)
      user.role = user.role || "borrower";
      user.createdAt = new Date();

      const result = await userCollection.insertOne(user);

      res.json({
        success: true,
        message: "User created successfully",
        id: result.insertedId,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // =============================
  // 2. Get All Users
  // =============================
  router.get("/", async (req, res) => {
    try {
      const users = await userCollection.find().toArray();
      res.json(users);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // =============================
  // 3. Get Single User by Email
  // =============================
  router.get("/:email", async (req, res) => {
    try {
      const email = req.params.email;

      const user = await userCollection.findOne({ email });

      res.json(user);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // =============================
  // 4. Update User Role (Admin)
  // =============================
  router.patch("/role/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const { role } = req.body;

      const result = await userCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { role } }
      );

      res.json({
        success: true,
        message: "User role updated",
        result,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}

module.exports = userRoutes;
