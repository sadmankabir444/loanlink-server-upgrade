const express = require("express");
const router = express.Router();
const verifyJWT = require("../middlewares/verifyJWT");
const verifyManager = require("../middlewares/verifyManager");
const { ObjectId } = require("mongodb");

// 📥 Get Pending Loan Applications (Manager only)
router.get("/pending", verifyJWT, verifyManager, async (req, res) => {
  const loanAppsCollection = req.app.locals.loanApplicationsCollection;

  const result = await loanAppsCollection
    .find({ status: "Pending" })
    .toArray();

  res.send(result);
});

// 📥 Get Approved Loan Applications (Manager only)
router.get("/approved", verifyJWT, verifyManager, async (req, res) => {
  const loanAppsCollection = req.app.locals.loanApplicationsCollection;

  const result = await loanAppsCollection
    .find({ status: "Approved" })
    .toArray();

  res.send(result);
});


// ✅ Approve loan
router.patch("/approve/:id", verifyJWT, verifyManager, async (req, res) => {
  const loanAppsCollection = req.app.locals.loanApplicationsCollection;
  const { id } = req.params;

  const result = await loanAppsCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { status: "Approved", approvedAt: new Date() } }
  );

  res.send(result);
});

// ❌ Reject loan
router.patch("/reject/:id", verifyJWT, verifyManager, async (req, res) => {
  const loanAppsCollection = req.app.locals.loanApplicationsCollection;
  const { id } = req.params;

  const result = await loanAppsCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { status: "Rejected" } }
  );

  res.send(result);
});

module.exports = router;
