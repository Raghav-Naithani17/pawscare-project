require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const PORT = 3000;

app.use(cors());
app.use(express.json());

/* DB CONNECT */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

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
  createdAt: String
}));

/* ADOPTION */
const Adoption = mongoose.model("Adoption", new mongoose.Schema({
  name: String,
  contact: String,
  animal: String,
  reason: String,
  createdAt: String
}));


app.get("/", (req, res) => {
  res.send("Backend working");
});


app.post("/report", async (req, res) => {
  try {
    const newReport = await Report.create(req.body);

    io.emit("newReport", newReport);

    res.json({ message: "Report saved" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed" });
  }
});


app.get("/reports", async (req, res) => {
  const data = await Report.find().sort({ createdAt: -1 });
  res.json(data);
});

/* UPDATE REPORT */
app.put("/report/:id", async (req, res) => {
  const updated = await Report.findByIdAndUpdate(req.params.id, req.body, { new: true });
  io.emit("updateReport", updated);
  res.json({ message: "Updated" });
});


app.delete("/report/:id", async (req, res) => {
  await Report.findByIdAndDelete(req.params.id);
  io.emit("deleteReport", req.params.id);
  res.json({ message: "Deleted" });
});


app.post("/adopt", async (req, res) => {
  try {
    const newAdoption = await Adoption.create(req.body);

    res.json({ message: "Adoption saved" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed" });
  }
});


app.get("/adoptions", async (req, res) => {
  const data = await Adoption.find().sort({ createdAt: -1 });
  res.json(data);
});


server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});