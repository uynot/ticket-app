const Ticket = require("../models/Ticket");

// POST /api/tickets
const createTicket = async (req, res) => {
	try {
		const ticket = await Ticket.create(req.body);
		res.status(201).json(ticket);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

// GET /api/tickets
const getAllTickets = async (req, res) => {
	try {
		const query = {};
		const allowedFilters = [
			"performer",
			"date",
			"location",
			"roll",
			"seat",
			"isConsecutive",
			"price",
			"pickupDate",
			"bot",
			"soldPrice",
			"status",
			"holdBy",
			"holdDate",
			"holdExpireDuration",
			"profit",
			"createdBy",
			"updatedBy",
		];

		const mongoose = require("mongoose");

		allowedFilters.forEach((key) => {
			if (req.query[key]) {
				if (key === "holdBy") {
					query[key] = new mongoose.Types.ObjectId(req.query[key]);
				} else if (typeof req.query[key] === "string" && ["performer", "location", "roll", "seat", "bot", "status"].includes(key)) {
					query[key] = new RegExp(req.query[key], "i");
				} else {
					query[key] = req.query[key];
				}
			}
		});

		const tickets = await Ticket.find(query).sort({ date: -1 });
		res.json(tickets);
	} catch (error) {
		res.status(500).json({ message: "Error fetching tickets", error: error.message });
	}
};

// PATCH /api/tickets/:id/unhold
const unholdTicket = async (req, res) => {
	try {
		const ticket = await Ticket.findById(req.params.id);
		if (!ticket) return res.status(404).json({ message: "Ticket not found" });

		if (ticket.status !== "hold") {
			return res.status(400).json({ message: "Ticket is not on hold" });
		}

		ticket.status = "pending";
		ticket.holdBy = undefined;
		ticket.holdDate = undefined;
		ticket.updatedBy = req.user?._id || null;

		await ticket.save();
		res.json({ message: "Ticket unheld successfully", ticket });
	} catch (error) {
		res.status(500).json({ message: "Error unholding ticket", error: error.message });
	}
};

// DELETE /api/tickets/:id
const deleteTicket = async (req, res) => {
	try {
		const ticket = await Ticket.findByIdAndDelete(req.params.id);
		if (!ticket) {
			return res.status(404).json({ message: "Ticket not found" });
		}
		res.json({ message: "Ticket deleted successfully", ticket });
	} catch (error) {
		res.status(500).json({ message: "Error deleting ticket", error: error.message });
	}
};

module.exports = {
	createTicket,
	getAllTickets,
	unholdTicket,
	deleteTicket,
};
