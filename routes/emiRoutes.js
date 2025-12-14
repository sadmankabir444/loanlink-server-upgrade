// const express = require("express");
// const router = express.Router();

// // EMI Formula:
// // EMI = [ P x R x (1+R)^N ] / [ (1+R)^N – 1 ]

// module.exports = () => {
//   router.post("/calculate", (req, res) => {
//     try {
//       const { principal, interestRate, months } = req.body;

//       if (!principal || !interestRate || !months) {
//         return res
//           .status(400)
//           .json({ message: "Principal, interestRate & months required" });
//       }

//       const P = Number(principal);
//       const R = Number(interestRate) / 12 / 100;
//       const N = Number(months);

//       const emi =
//         (P * R * Math.pow(1 + R, N)) /
//         (Math.pow(1 + R, N) - 1);

//       const totalPayment = emi * N;
//       const totalInterest = totalPayment - P;

//       res.json({
//         emi: parseFloat(emi.toFixed(2)),
//         totalPayment: parseFloat(totalPayment.toFixed(2)),
//         totalInterest: parseFloat(totalInterest.toFixed(2)),
//       });
//     } catch (error) {
//       res.status(500).json({ message: "Error calculating EMI", error });
//     }
//   });

//   return router;
// };
