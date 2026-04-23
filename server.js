require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

/*  SOCKET FIX (important for Render) */
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

/* MIDDLEWARE */
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

/* =========================
   DB CONNECT (FIXED)
========================= */
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log("✅ MongoDB Connected Successfully");
})
.catch((err) => {
  console.log("❌ MongoDB Connection Error:");
  console.log(err);
});

/* =========================
   SCHEMAS
========================= */

/* REPORT */
const Report = mongoose.model("Report", new mongoose.Schema({
  reporterName: String,
  reporterContact: String,
  animalType: String,
  location: String,
  description: String,
  status: { type: String, default: "Pending" },
  createdAt: {
    type: Date,
    default: Date.now
  }
}));

/* ADOPTION */
const Adoption = mongoose.model("Adoption", new mongoose.Schema({
  name: String,
  contact: String,
  animal: String,
  reason: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
}));

/* =========================
   ROUTES
========================= */

/* HOME */
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

/* CREATE REPORT */
app.post("/report", async (req, res) => {
  try {
    const newReport = await Report.create(req.body);

    io.emit("newReport", newReport); // realtime update

    res.status(201).json(newReport);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to save report" });
  }
});

/* GET REPORTS */
app.get("/reports", async (req, res) => {
  try {
    const data = await Report.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

/* UPDATE REPORT */
app.put("/report/:id", async (req, res) => {
  try {
    const updated = await Report.findByIdAndUpdate(req.params.id, req.body, { new: true });
    io.emit("updateReport", updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

/* DELETE REPORT */
app.delete("/report/:id", async (req, res) => {
  try {
    await Report.findByIdAndDelete(req.params.id);
    io.emit("deleteReport", req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

/* CREATE ADOPTION */
app.post("/adopt", async (req, res) => {
  try {
    const newAdoption = await Adoption.create(req.body);
    res.status(201).json(newAdoption);
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

/* GET ADOPTIONS */
app.get("/adoptions", async (req, res) => {
  try {
    const data = await Adoption.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch" });
  }
});

/* =========================
   SOCKET CONNECTION LOG
========================= */
io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

/* =========================
   START SERVER
========================= */
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});