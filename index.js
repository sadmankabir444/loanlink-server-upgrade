const express = require("express");
const corsConfig = require("./middleware/corsConfig");
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(corsConfig);
app.use(express.json());

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mongodb.net/?retryWrites=true&w=majority`;

// Mongo Client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("loanlinkDB");
    const usersCollection = db.collection("users");
    const loansCollection = db.collection("loans");
    const applicationsCollection = db.collection("loanApplications");

    // USERS =========================

    app.post("/users", async (req, res) => {
      const user = req.body;
      const exists = await usersCollection.findOne({ email: user.email });
      if (exists) return res.send({ message: "User already exists" });
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const result = await usersCollection.findOne({ email });
      res.send(result);
    });

    // LOANS =========================

    app.get("/loans", async (req, res) => {
      const limit = parseInt(req.query.limit);
      const cursor = loansCollection.find();
      const result = limit ? await cursor.limit(limit).toArray() : await cursor.toArray();
      res.send(result);
    });

    app.get("/loans/:id", async (req, res) => {
      const id = req.params.id;
      const result = await loansCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // APPLICATIONS ==================

    app.post("/loan-applications", async (req, res) => {
      const application = req.body;
      const result = await applicationsCollection.insertOne(application);
      res.send(result);
    });

    app.get("/loan-applications", async (req, res) => {
      const { email, status } = req.query;
      let query = {};
      if (email) query.email = email;
      if (status) query.status = status;
      const result = await applicationsCollection.find(query).toArray();
      res.send(result);
    });

    app.patch("/loan-applications/:id", async (req, res) => {
      const id = req.params.id;
      const update = req.body;
      const result = await applicationsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: update }
      );
      res.send(result);
    });



    app.post("/loans", async (req, res) => {
  const loan = req.body;
  const result = await loansCollection.insertOne(loan);
  res.send(result);
});

app.delete("/loans/:id", async (req, res) => {
  const id = req.params.id;
  const result = await loansCollection.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});




    // HEALTH CHECK
    app.get("/", (req, res) => {
      res.send("LoanLink Server Running 🚀");
    });

  } finally {
    console.log("MongoDB Connected");
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
