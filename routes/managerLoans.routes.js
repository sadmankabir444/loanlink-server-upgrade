const express = require("express");
const { ObjectId } = require("mongodb");

module.exports = (db) => {
  const router = express.Router();
  const applicationsCollection = db.collection("loanApplications");
  const loansCollection = db.collection("loans"); 

  
  // Middleware
  
  const verifyToken = (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    const jwt = require("jsonwebtoken");
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ message: "Forbidden" });
      req.user = decoded;
      next();
    });
  };

  const verifyManager = (req, res, next) => {
    if (req.user && (req.user.role === "manager" || req.user.role === "admin")) {
      return next();
    }
    return res.status(403).json({ message: "Forbidden: Manager access only" });
  };

  
  // POST Add Loan
  
  router.post("/add-loan", verifyToken, verifyManager, async (req, res) => {
    try {
      const loan = req.body;
      loan.createdAt = new Date();
      loan.status = loan.status || "pending";

      const result = await loansCollection.insertOne(loan);
      res.status(201).json(result);
    } catch (err) {
      console.error("Add loan error:", err);
      res.status(500).json({ message: "Failed to add loan", error: err.message });
    }
  });

  
  // GET My Loans

  router.get("/my-loans", verifyToken, verifyManager, async (req, res) => {
    try {
      const myLoans = await applicationsCollection
        .find({ managerEmail: req.user.email }) 
        .toArray();
      res.send(myLoans);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch loans", error: err.message });
    }
  });

  
  // GET Pending Loans
  
  router.get("/pending", verifyToken, verifyManager, async (req, res) => {
    try {
      const result = await applicationsCollection.find({ status: "Pending" }).toArray();
      res.send(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch pending applications", error: err.message });
    }
  });

  
  // GET Approved Loans
  
  router.get("/approved", verifyToken, verifyManager, async (req, res) => {
    try {
      const result = await applicationsCollection.find({ status: "Approved" }).toArray();
      res.send(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch approved applications", error: err.message });
    }
  });

  
// PATCH Approve Loan

router.patch("/approve/:id", verifyToken, verifyManager, async (req, res) => {
  try {
    const loanId = req.params.id;

    const result = await applicationsCollection.updateOne(
      { _id: new ObjectId(loanId) },
      { $set: { status: "Approved" } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Loan not found or already approved" });
    }

    res.json({ message: "Loan approved successfully" });
  } catch (err) {
    console.error("Approve loan error:", err);
    res.status(500).json({ message: "Failed to approve loan", error: err.message });
  }
});



// PATCH Reject Loan

router.patch("/reject/:id", verifyToken, verifyManager, async (req, res) => {
  try {
    const loanId = req.params.id;

    const result = await applicationsCollection.updateOne(
      { _id: new ObjectId(loanId) },
      { $set: { status: "Rejected" } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Loan not found or already processed" });
    }

    res.json({ message: "Loan rejected successfully" });
  } catch (err) {
    console.error("Reject loan error:", err);
    res.status(500).json({ message: "Failed to reject loan", error: err.message });
  }
});


  return router;
};
