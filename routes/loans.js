const express = require("express");
const { ObjectId } = require("mongodb");

function loanRoutes(db) {
  const router = express.Router();
  const loanCollection = db.collection("loans");

  // =============================
  // 1. Create a new loan request
  // =============================
  router.post("/", async (req, res) => {
    try {
      const loanData = req.body;
      loanData.status = "pending";
      loanData.createdAt = new Date();

      const result = await loanCollection.insertOne(loanData);

      res.json({
        success: true,
        message: "Loan request created successfully!",
        id: result.insertedId,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // =============================
  // 2. Get all loan requests
  // =============================
  router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit);

    let cursor = loanCollection.find();

    if (limit) {
      cursor = cursor.limit(limit);
    }

    const loans = await cursor.toArray();
    res.json(loans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


  // ======================================
  // 3. Update loan status (approve/reject)
  // ======================================
  router.patch("/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const { status } = req.body;

      const result = await loanCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status } }
      );

      res.json({
        success: true,
        message: "Loan status updated",
        result,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}

module.exports = loanRoutes;
