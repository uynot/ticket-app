const express = require("express");
const router = express.Router();
const { createTicket, getAllTickets, unholdTicket, deleteTicket } = require("../controllers/ticketController");

const { protect } = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/isAdmin");

// auth
router.patch("/:id/unhold", protect, isAdmin, unholdTicket);
router.delete("/:id", protect, isAdmin, deleteTicket);
router.patch("/:id/unhold", protect, isAdmin, unholdTicket);
router.delete("/:id", protect, isAdmin, deleteTicket);

// ticket
router.post("/", createTicket);
router.get("/", getAllTickets);
router.patch("/:id/unhold", unholdTicket);
router.delete("/:id", deleteTicket);

module.exports = router;
