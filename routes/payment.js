// const express = require("express");
// const router = express.Router();
// const Stripe = require("stripe");
// const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");
// require("dotenv").config();

// // Stripe setup
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// // MongoDB setup
// const uri = process.env.MONGO_URI;
// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   },
// });

// // Connect MongoDB once
// async function connectDB() {
//   try {
//     await client.connect();
//     console.log("MongoDB Connected!");
//   } catch (err) {
//     console.error("MongoDB connection error:", err);
//   }
// }
// connectDB();

// // Create Stripe Checkout Session
// router.post("/create-checkout-session", async (req, res) => {
//   const { loanId, userEmail, amount } = req.body;

//   try {
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ["card"],
//       line_items: [
//         {
//           price_data: {
//             currency: "usd",
//             product_data: {
//               name: "Loan Application Fee",
//             },
//             unit_amount: amount, // cents: $10 = 1000
//           },
//           quantity: 1,
//         },
//       ],
//       mode: "payment",
//       success_url: `http://localhost:5173/dashboard/my-loans?success=true&loanId=${loanId}&email=${userEmail}`,
//       cancel_url: `http://localhost:5173/dashboard/my-loans?canceled=true`,
//       client_reference_id: loanId,
//       customer_email: userEmail,
//     });

//     res.json({ id: session.id });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Stripe checkout session failed" });
//   }
// });

// // Optional: Stripe webhook for successful payment
// router.post(
//   "/webhook",
//   express.raw({ type: "application/json" }),
//   async (req, res) => {
//     const sig = req.headers["stripe-signature"];
//     let event;

//     try {
//       event = stripe.webhooks.constructEvent(
//         req.body,
//         sig,
//         process.env.STRIPE_WEBHOOK_SECRET
//       );
//     } catch (err) {
//       console.log(`Webhook error: ${err.message}`);
//       return res.status(400).send(`Webhook error: ${err.message}`);
//     }

//     if (event.type === "checkout.session.completed") {
//       const session = event.data.object;

//       try {
//         const db = client.db("loanlinkDB");
//         await db.collection("loan-applications").updateOne(
//           { _id: new ObjectId(session.client_reference_id), userEmail: session.customer_email },
//           {
//             $set: {
//               applicationFeeStatus: "paid",
//               transactionId: session.payment_intent,
//             },
//           }
//         );
//         console.log(`Loan ${session.client_reference_id} fee status updated`);
//       } catch (err) {
//         console.error(err);
//       }
//     }

//     res.json({ received: true });
//   }
// );

// module.exports = router;
