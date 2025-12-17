const express = require("express");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const path = require("path");

// Routes
const adminUsersRoutes = require("./routes/adminUsers.routes");
const adminLoansRoutes = require("./routes/adminLoans.routes");
const managerLoansRoutes = require("./routes/managerLoans.routes");

const app = express();
const port = process.env.PORT || 3000;

/* =======================
   Middleware
======================= */
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

/* =======================
   MongoDB Connection
======================= */
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_CLUSTER}.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

/* =======================
   Main Server Function
======================= */
async function run() {
  try {
    await client.connect();
    console.log("✅ MongoDB Connected");

    const db = client.db(process.env.DB_NAME);
    const usersCollection = db.collection("users");
    const loansCollection = db.collection("loans");
    const applicationsCollection = db.collection("loanApplications");

    /* =======================
       JWT VERIFY
    ======================= */
    const verifyToken = (req, res, next) => {
      const token = req.cookies?.token;

      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          return res.status(403).json({ message: "Forbidden" });
        }

        req.user = decoded;
        next();
      });
    };

    /* =======================
       USERS
    ======================= */
    app.post("/users", async (req, res) => {
      try {
        const { email, name, photo, role } = req.body;

        if (!email) return res.status(400).json({ message: "Email is required" });

        const existingUser = await usersCollection.findOne({ email });

        if (existingUser) {
          // User already exists → ignore error
          return res.json(existingUser);
        }

        const user = {
          email,
          name: name || "",
          photo: photo || "",
          role: role || "borrower",
          createdAt: new Date(),
        };

        const result = await usersCollection.insertOne(user);
        res.json({ ...user, _id: result.insertedId });
      } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    app.get("/users", async (req, res) => {
      try {
        const users = await usersCollection.find().toArray();
        res.send(users);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    app.get("/users/:email", async (req, res) => {
      try {
        const user = await usersCollection.findOne({ email: req.params.email });
        res.send(user);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    /* =======================
       LOGIN (JWT + COOKIE)
    ======================= */
    app.post("/login", async (req, res) => {
      try {
        const { email, password } = req.body;

        if (!email) {
          return res.status(400).json({ message: "Email is required" });
        }

        let user = await usersCollection.findOne({ email });

        if (password) {
          // normal email/password login
          if (!user || user.password !== password) {
            return res.status(401).json({ message: "Invalid email or password" });
          }
        } else {
          // password missing → Firebase / Google login
          if (!user) {
            const newUser = {
              email,
              role: "borrower",
              createdAt: new Date(),
            };
            const result = await usersCollection.insertOne(newUser);
            user = { _id: result.insertedId, ...newUser };
          }
        }

        const token = jwt.sign(
          {
            id: user._id,
            email: user.email,
            role: user.role,
          },
          process.env.JWT_SECRET,
          { expiresIn: "7d" }
        );

        res
          .cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
          })
          .json({
            success: true,
            user: {
              name: user.name,
              email: user.email,
              role: user.role,
            },
          });
      } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    /* =======================
       LOANS
    ======================= */
    app.post("/loans", async (req, res) => {
      try {
        const loan = req.body;
        loan.createdAt = new Date();
        loan.status = loan.status || "pending";

        const result = await loansCollection.insertOne(loan);
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    app.get("/loans", async (req, res) => {
      try {
        const limit = parseInt(req.query.limit);
        const cursor = loansCollection.find().sort({ createdAt: -1 });
        const loans = limit
          ? await cursor.limit(limit).toArray()
          : await cursor.toArray();

        res.send(loans);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    app.get("/loans/:id", async (req, res) => {
      try {
        const loan = await loansCollection.findOne({ _id: new ObjectId(req.params.id) });
        res.send(loan);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    app.delete("/loans/:id", async (req, res) => {
      try {
        const result = await loansCollection.deleteOne({ _id: new ObjectId(req.params.id) });
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    /* =======================
       LOAN APPLICATIONS
    ======================= */
    app.post("/loan-applications", async (req, res) => {
      try {
        const application = req.body;
        application.createdAt = new Date();
        application.status = "Pending";
        application.feeStatus = "Unpaid";

        const result = await applicationsCollection.insertOne(application);
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    app.get("/loan-applications", async (req, res) => {
      try {
        const { email, status } = req.query;
        const query = {};
        if (email) query.email = email;
        if (status) query.status = status;

        const result = await applicationsCollection.find(query).toArray();
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    app.patch("/loan-applications/:id", async (req, res) => {
      try {
        const result = await applicationsCollection.updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: req.body }
        );
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    /* =======================
       ROLE BASED ROUTES
    ======================= */
    app.use("/admin", adminUsersRoutes);
    app.use("/admin", adminLoansRoutes(db));
    app.use("/manager", managerLoansRoutes(db));

    /* =======================
       Health Check
    ======================= */
    app.get("/", (req, res) => {
      res.send("🚀 LoanLink Server Running");
    });

    /* =======================
       React Build Serve
    ======================= */
    const clientBuildPath = path.join(__dirname, "client/build");
    app.use(express.static(clientBuildPath));

    app.get("*", (req, res) => {
      res.sendFile(path.join(clientBuildPath, "index.html"));
    });
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

/* =======================
   Start Server
======================= */
run();

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
