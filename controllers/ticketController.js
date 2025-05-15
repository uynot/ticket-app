const Ticket = require("../models/Ticket");
const mongoose = require("mongoose");
const fs = require("fs");
const csv = require("csv-parser");

const getUserId = (req) => req.user?._id || null;

// POST /api/tickets
const createTicket = async (req, res) => {
	try {
		const ticketsInput = Array.isArray(req.body) ? req.body : [req.body];

		const ticketsData = ticketsInput.map((ticket) => ({
			...ticket,
			createdBy: getUserId(req),
			createdDate: new Date(),
		}));

		const tickets = await Ticket.insertMany(ticketsData);
		res.status(201).json({ message: "Ticket(s) created", count: tickets.length, tickets });
	} catch (error) {
		res.status(400).json({ message: "Error creating tickets", error: error.message });
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
// param: editable fields in JSON
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

		// admin override
		const isAdmin = req.user.role === "admin";
		if (!isAdmin && ticket.holdBy?.toString() !== req.user._id.toString()) {
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

// PATCH /api/tickets/:id/unsold
const unsoldTicket = async (req, res) => {
	try {
		const ticket = await Ticket.findById(req.params.id);
		if (!ticket) return res.status(404).json({ message: "Ticket not found" });

		if (ticket.status !== "sold") {
			return res.status(400).json({ message: "Ticket is not marked as sold" });
		}

		ticket.status = "on hold";
		ticket.soldBy = null;
		ticket.soldDate = null;
		ticket.soldPrice = 0;
		ticket.profit = 0;
		ticket.updatedBy = getUserId(req);
		ticket.updatedDate = new Date();

		await ticket.save();
		res.json({ message: "Ticket unsold successfully", ticket });
	} catch (error) {
		res.status(500).json({ message: "Error unselling ticket", error: error.message });
	}
};

// PATCH /api/tickets/:id/hold
// param: holdExpireDuration in JSON
const holdTicket = async (req, res) => {
	try {
		const ticket = await Ticket.findById(req.params.id);
		if (!ticket) return res.status(404).json({ message: "Ticket not found" });

		if (ticket.status === "on hold") {
			return res.status(400).json({ message: "Ticket is already on hold" });
		}

		ticket.status = "on hold";
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

		if (ticket.status !== "on hold") {
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

// PATCH /api/tickets/:id
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

// POST /api/tickets/import
// filetype: csv
const importTickets = async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ message: "No file uploaded" });
		}

		const tickets = [];
		const errors = [];
		const warnings = [];

		fs.createReadStream(req.file.path)
			.pipe(csv())
			.on("data", (row) => {
				try {
					const requiredFields = ["performer", "date", "location", "row", "seat", "price"];
					for (const field of requiredFields) {
						if (!row[field]) throw new Error(`Missing required field: ${field}`);
					}

					const price = Number(row.price);
					if (isNaN(price)) throw new Error("Invalid price");

					const soldPrice = Number(row.soldPrice || 0);
					const status = (row.status || "pending").toLowerCase();
					const validStatuses = ["pending", "sold", "on hold"];
					if (!validStatuses.includes(status)) throw new Error(`Invalid status: ${row.status}`);

					const isSold = status === "sold";
					const isHold = status === "on hold";

					const soldDate = row.soldDate ? new Date(row.soldDate) : null;
					if (isSold) {
						if (!soldPrice || isNaN(soldPrice)) throw new Error("Missing or invalid soldPrice");
						if (!soldDate || isNaN(soldDate)) throw new Error("Missing or invalid soldDate");
					}

					const holdDate = row.holdDate ? new Date(row.holdDate) : null;
					if (isHold && (!holdDate || isNaN(holdDate))) {
						warnings.push({ row, warning: "Ticket is on hold but holdDate is invalid" });
					}

					const holdExpireDuration = row.holdExpireDuration ? Number(row.holdExpireDuration) : 4320;
					if (isNaN(holdExpireDuration)) {
						warnings.push({
							row,
							warning: "Invalid holdExpireDuration, defaulted to 4320 minutes",
						});
					}

					tickets.push({
						performer: row.performer,
						date: new Date(row.date),
						location: row.location,
						row: row.row,
						seat: row.seat,
						isConsecutive: row.isConsecutive === "true",
						price,
						pickupDate: row.pickupDate ? new Date(row.pickupDate) : undefined,
						bot: row.bot || "",
						remark: row.remark || "",
						status,
						soldPrice: isSold ? soldPrice : 0,
						soldBy: isSold && row.soldBy ? req.user._id : undefined,
						soldDate: isSold ? soldDate : undefined,
						holdBy: isHold && row.holdBy ? req.user._id : undefined,
						holdDate: isHold ? holdDate : undefined,
						holdExpireDuration: isNaN(holdExpireDuration) ? 4320 : holdExpireDuration,
						profit: isSold ? soldPrice - price : 0,
						createdBy: req.user._id,
						createdDate: new Date(),
					});
				} catch (err) {
					errors.push({ row, error: err.message });
				}
			})
			.on("end", async () => {
				await Ticket.insertMany(tickets);
				fs.unlinkSync(req.file.path);

				res.json({
					message: "Import completed",
					successCount: tickets.length,
					errorCount: errors.length,
					warningCount: warnings.length,
					errors,
					warnings,
				});
			});
	} catch (error) {
		res.status(500).json({ message: "Import failed", error: error.message });
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
	unsoldTicket,
	importTickets,
};
