require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");

const app = express();
const server = http.createServer(app);

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
app.use("/uploads", express.static("uploads"));

/* MULTER SETUP */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

/* DB CONNECT */
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log(err));

/* SCHEMAS */
const Report = mongoose.model("Report", new mongoose.Schema({
  reporterName: String,
  reporterContact: String,
  animalType: String,
  location: String,
  description: String,
  image: String,
  status: { type: String, default: "Pending" },
  createdAt: { type: Date, default: Date.now }
}));

const Adoption = mongoose.model("Adoption", new mongoose.Schema({
  name: String,
  contact: String,
  animal: String,
  reason: String,
  createdAt: { type: Date, default: Date.now }
}));

/* ROUTES */
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

/* CREATE REPORT (WITH IMAGE) */
app.post("/report", upload.single("image"), async (req, res) => {
  try {
    const newReport = await Report.create({
      ...req.body,
      image: req.file ? req.file.filename : null
    });

    io.emit("newReport", newReport);

    res.status(201).json(newReport);
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

/* GET REPORTS */
app.get("/reports", async (req, res) => {
  const data = await Report.find().sort({ createdAt: -1 });
  res.json(data);
});

/* UPDATE */
app.put("/report/:id", async (req, res) => {
  const updated = await Report.findByIdAndUpdate(req.params.id, req.body, { new: true });
  io.emit("updateReport", updated);
  res.json(updated);
});

/* DELETE */
app.delete("/report/:id", async (req, res) => {
  await Report.findByIdAndDelete(req.params.id);
  io.emit("deleteReport", req.params.id);
  res.json({ message: "Deleted" });
});

/* ADOPTION */
app.post("/adopt", async (req, res) => {
  const newAdoption = await Adoption.create(req.body);
  res.json(newAdoption);
});

/* SOCKET */
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
});

/* START */
server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});