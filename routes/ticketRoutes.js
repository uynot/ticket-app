const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const {
	createTicket,
	getAllTickets,
	editTicketDetail,
	soldTicket,
	unsoldTicket,
	holdTicket,
	unholdTicket,
	deleteTicket,
	undeleteTicket,
	importTickets,
} = require("../controllers/ticketController");

const { protect } = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/isAdmin");

// auth

// ticket
router.post("/", protect, isAdmin, createTicket);
router.get("/", getAllTickets); // protect,
router.patch("/:id/edit", protect, isAdmin, editTicketDetail);
router.patch("/:id/sold", protect, soldTicket);
router.patch("/:id/unsold", protect, isAdmin, unsoldTicket);
router.patch("/:id/hold", protect, holdTicket);
router.patch("/:id/unhold", protect, isAdmin, unholdTicket);
router.patch("/:id/delete", protect, isAdmin, deleteTicket);
router.patch("/:id/undelete", protect, isAdmin, undeleteTicket);
router.post("/import", protect, isAdmin, upload.single("file"), importTickets);

module.exports = router;
