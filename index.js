const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
const uri =
  "mongodb+srv://loan-link:59LjyohVxLdTsqmQ@cluster0.56d1e2x.mongodb.net/?appName=Cluster0";

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
    await client.db("admin").command({ ping: 1 });
    console.log("MongoDB Connected!");

    const db = client.db("loanlinkDB");

    // ROUTES IMPORT
    const loanRoutes = require("./routes/loanRoutes")(db);
    const userRoutes = require("./routes/userRoutes")(db);
    const emiRoutes = require("./routes/emiRoutes")();

    // ROUTES USE
    app.use("/loans", loanRoutes);
    app.use("/users", userRoutes);
    app.use("/emi", emiRoutes);

    // Default Route
    app.get("/", (req, res) => {
      res.send("LoanLink Server Running!");
    });
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

run().catch(console.dir);

// Start Server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
