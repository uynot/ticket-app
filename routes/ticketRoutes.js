const express = require("express");
const router = express.Router();
const { createTicket, getAllTickets, holdTicket, unholdTicket, deleteTicket } = require("../controllers/ticketController");

const { protect } = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/isAdmin");

// auth

// ticket
router.post("/", protect, createTicket);
router.get("/", getAllTickets);
router.patch("/:id/hold", protect, holdTicket);
router.patch("/:id/unhold", protect, isAdmin, unholdTicket);
router.delete("/:id", protect, isAdmin, deleteTicket);

module.exports = router;
