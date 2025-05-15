// server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

//  routes
const ticketRoutes = require("./routes/ticketRoutes");
//const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");

//  use routes
app.use("/api/tickets", ticketRoutes);
//app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

//start server
app.get("/", (req, res) => res.send("API Running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
