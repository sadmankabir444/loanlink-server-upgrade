const express = require("express");
const router = express.Router();
const verifyJWT = require("../middlewares/verifyJWT");
const { ObjectId } = require("mongodb");

// 📥 Get current user's loans
router.get("/my-loans", verifyJWT, async (req, res) => {
  const loanAppsCollection = req.app.locals.loanApplicationsCollection;
  const result = await loanAppsCollection
    .find({ "userEmail": req.user.email })
    .toArray();
  res.send(result);
});

// ❌ Cancel Pending Loan
router.patch("/cancel/:id", verifyJWT, async (req, res) => {
  const loanAppsCollection = req.app.locals.loanApplicationsCollection;
  const { id } = req.params;

  const loan = await loanAppsCollection.findOne({ _id: new ObjectId(id) });
  if (!loan) return res.status(404).send({ error: "Loan not found" });
  if (loan.status !== "Pending")
    return res.status(400).send({ error: "Only pending loans can be cancelled" });

  await loanAppsCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { status: "Cancelled" } }
  );

  res.send({ success: true });
});

// 💰 Update Payment Status (called after Stripe success)
router.patch("/pay/:id", verifyJWT, async (req, res) => {
  const loanAppsCollection = req.app.locals.loanApplicationsCollection;
  const { id } = req.params;
  const { transactionId } = req.body;

  await loanAppsCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { applicationFeeStatus: "Paid", paymentInfo: { transactionId, paidAt: new Date() } } }
  );

  res.send({ success: true });
});

module.exports = router;
