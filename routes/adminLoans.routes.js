const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const verifyJWT = require("../middlewares/verifyJWT");
const verifyAdmin = require("../middlewares/verifyAdmin");

// 🔹 Get all loans
router.get("/all-loans", verifyJWT, verifyAdmin, async (req, res) => {
  const loansCollection = req.app.locals.loansCollection;
  const result = await loansCollection.find().toArray();
  res.send(result);
});

// 🔹 Toggle showOnHome
router.patch("/loan/show-home/:id", verifyJWT, verifyAdmin, async (req, res) => {
  const loansCollection = req.app.locals.loansCollection;
  const { showOnHome } = req.body;

  const result = await loansCollection.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: { showOnHome } }
  );

  res.send(result);
});

// 🔹 Update loan
router.patch("/loan/update/:id", verifyJWT, verifyAdmin, async (req, res) => {
  const loansCollection = req.app.locals.loansCollection;

  const result = await loansCollection.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: req.body }
  );

  res.send(result);
});

// 🔹 Delete loan
router.delete("/loan/:id", verifyJWT, verifyAdmin, async (req, res) => {
  const loansCollection = req.app.locals.loansCollection;
  const result = await loansCollection.deleteOne({
    _id: new ObjectId(req.params.id),
  });
  res.send(result);
});

module.exports = router;
