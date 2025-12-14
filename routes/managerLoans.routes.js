const express = require("express");
const router = express.Router();
const verifyJWT = require("../middlewares/verifyJWT");
const verifyManager = require("../middlewares/verifyManager");
const { ObjectId } = require("mongodb");

// ➕ Add Loan (already added)
router.post("/add-loan", verifyJWT, verifyManager, async (req, res) => {
  const loansCollection = req.app.locals.loansCollection;

  const loan = {
    ...req.body,
    interest: Number(req.body.interest),
    maxAmount: Number(req.body.maxAmount),
    createdBy: {
      email: req.user.email,
      role: "manager",
    },
    createdAt: new Date(),
  };

  const result = await loansCollection.insertOne(loan);
  res.send({ success: true, insertedId: result.insertedId });
});

// 📥 Get manager's loans
router.get("/my-loans", verifyJWT, verifyManager, async (req, res) => {
  const loansCollection = req.app.locals.loansCollection;

  const result = await loansCollection
    .find({ "createdBy.email": req.user.email })
    .toArray();

  res.send(result);
});

// ✏️ Update loan
router.patch("/update-loan/:id", verifyJWT, verifyManager, async (req, res) => {
  const loansCollection = req.app.locals.loansCollection;
  const { id } = req.params;

  const updateDoc = {
    $set: req.body,
  };

  const result = await loansCollection.updateOne(
    { _id: new ObjectId(id) },
    updateDoc
  );

  res.send(result);
});

// 🗑️ Delete loan
router.delete("/delete-loan/:id", verifyJWT, verifyManager, async (req, res) => {
  const loansCollection = req.app.locals.loansCollection;
  const { id } = req.params;

  const result = await loansCollection.deleteOne({
    _id: new ObjectId(id),
  });

  res.send(result);
});

module.exports = router;
