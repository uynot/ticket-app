const Ticket = require("../models/Ticket");

const createTicket = async (req, res) => {
	try {
		const ticket = await Ticket.create(req.body);
		res.status(201).json(ticket);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

module.exports = { createTicket };
