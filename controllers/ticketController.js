const Ticket = require("../models/Ticket");
const mongoose = require("mongoose");

const getUserId = (req) => req.user?._id || null;

// POST /api/tickets
const createTicket = async (req, res) => {
	try {
		const ticketData = {
			...req.body,
			createdBy: getUserId(req),
			createdDate: new Date(),
			// updatedBy: getUserId(req),
			// updatedDate: new Date(),
		};

		const ticket = await Ticket.create(ticketData);
		res.status(201).json(ticket);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

// GET /api/tickets
const getAllTickets = async (req, res) => {
	try {
		const query = { isDeleted: false };

		const allowedFilters = [
			"performer",
			"date",
			"location",
			"row",
			"seat",
			"isConsecutive",
			"price",
			"pickupDate",
			"bot",
			"soldPrice",
			"soldBy",
			"soldDate",
			"status",
			"holdBy",
			"holdDate",
			"holdExpireDuration",
			"createdBy",
			"createdDate",
			"updatedBy",
			"updatedDate",
			"deletedBy",
			"deletedAt",
		];

		allowedFilters.forEach((key) => {
			if (req.query[key]) {
				if (["holdBy", "soldBy", "createdBy", "updatedBy", "deletedBy"].includes(key)) {
					query[key] = new mongoose.Types.ObjectId(req.query[key]);
				} else if (typeof req.query[key] === "string" && ["performer", "location", "row", "seat", "bot", "status"].includes(key)) {
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

// PATCH /api/tickets/:id/edit
const editTicketDetail = async (req, res) => {
	try {
		const ticket = await Ticket.findById(req.params.id);
		if (!ticket) return res.status(404).json({ message: "Ticket not found" });

		const editableFields = [
			"performer",
			"date",
			"location",
			"row",
			"seat",
			"isConsecutive",
			"price",
			"pickupDate",
			"bot",
			"remark",
			"soldPrice",
			"soldDate",
			"holdDate",
			"holdExpireDuration",
			"profit",
		];

		let isModified = false;

		editableFields.forEach((field) => {
			if (req.body[field] !== undefined && ticket[field] !== req.body[field]) {
				ticket[field] = req.body[field];
				isModified = true;
			}
		});

		if (isModified) {
			ticket.updatedBy = req.user._id;
			ticket.updatedDate = new Date();
			await ticket.save();
			res.json({ message: "Ticket updated successfully", ticket });
		} else {
			res.status(400).json({ message: "No fields to update" });
		}
	} catch (error) {
		res.status(500).json({ message: "Error updating ticket", error: error.message });
	}
};

// PATCH /api/tickets/:id/sold
// param: soldPrice in JSON
const soldTicket = async (req, res) => {
	try {
		const ticket = await Ticket.findById(req.params.id);
		if (!ticket) return res.status(404).json({ message: "Ticket not found" });

		if (ticket.status === "sold") {
			return res.status(400).json({ message: "Ticket is already sold" });
		}

		if (!ticket.holdBy || ticket.holdBy.toString() !== req.user._id.toString()) {
			return res.status(403).json({ message: "You are not the holder of this ticket" });
		}

		const { soldPrice } = req.body;
		if (typeof soldPrice !== "number" || soldPrice <= 0) {
			return res.status(400).json({ message: "Invalid soldPrice" });
		}

		ticket.status = "sold";
		ticket.soldBy = req.user._id;
		ticket.soldDate = new Date();
		ticket.soldPrice = soldPrice;
		ticket.profit = soldPrice - ticket.price;
		ticket.updatedBy = req.user._id;
		ticket.updatedDate = new Date();

		await ticket.save();
		res.json({ message: "Ticket marked as sold", ticket });
	} catch (error) {
		res.status(500).json({ message: "Error marking ticket as sold", error: error.message });
	}
};

// PATCH /api/tickets/:id/hold
// param: holdExpireDuration in JSON
const holdTicket = async (req, res) => {
	try {
		const ticket = await Ticket.findById(req.params.id);
		if (!ticket) return res.status(404).json({ message: "Ticket not found" });

		if (ticket.status === "hold") {
			return res.status(400).json({ message: "Ticket is already on hold" });
		}

		ticket.status = "hold";
		ticket.holdBy = getUserId(req);
		ticket.holdDate = new Date();
		ticket.updatedBy = getUserId(req);
		ticket.updatedDate = new Date();

		ticket.holdExpireDuration = req.body.holdExpireDuration || 4320;

		await ticket.save();
		res.json({ message: "Ticket held successfully", ticket });
	} catch (error) {
		res.status(500).json({ message: "Error holding ticket", error: error.message });
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
		ticket.updatedBy = getUserId(req);
		ticket.updatedDate = new Date();

		await ticket.save();
		res.json({ message: "Ticket unheld successfully", ticket });
	} catch (error) {
		res.status(500).json({ message: "Error unholding ticket", error: error.message });
	}
};

// DELETE /api/tickets/:id
const deleteTicket = async (req, res) => {
	try {
		const ticket = await Ticket.findById(req.params.id);
		if (!ticket) {
			return res.status(404).json({ message: "Ticket not found" });
		}

		ticket.isDeleted = true;
		ticket.deletedBy = req.user._id;
		ticket.deletedDate = new Date();
		ticket.updatedBy = getUserId(req);
		ticket.updatedDate = new Date();

		await ticket.save();
		res.json({ message: "Ticket deleted successfully", ticket });
	} catch (error) {
		res.status(500).json({ message: "Error deleting ticket", error: error.message });
	}
};

// PATCH /api/tickets/:id/undelete
const undeleteTicket = async (req, res) => {
	try {
		const ticket = await Ticket.findById(req.params.id);
		if (!ticket) {
			return res.status(404).json({ message: "Ticket not found" });
		}

		if (!ticket.isDeleted) {
			return res.status(400).json({ message: "Ticket is not deleted" });
		}

		ticket.isDeleted = false;
		ticket.deletedBy = null;
		ticket.deletedDate = null;
		ticket.updatedBy = getUserId(req);
		ticket.updatedDate = new Date();

		await ticket.save();
		res.json({ message: "Ticket undeleted successfully", ticket });
	} catch (error) {
		res.status(500).json({ message: "Error undeleting ticket", error: error.message });
	}
};

module.exports = {
	createTicket,
	getAllTickets,
	editTicketDetail,
	soldTicket,
	holdTicket,
	unholdTicket,
	deleteTicket,
	undeleteTicket,
};
