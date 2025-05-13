const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
	{
		performer: {
			type: String,
			required: true,
		},
		date: {
			type: Date,
			required: true,
		},
		location: {
			type: String,
			required: true,
		},
		roll: {
			type: String,
			required: true,
		},
		seat: {
			type: String,
			required: true,
		},
		isConsecutive: {
			type: Boolean,
			default: false,
		},
		price: {
			type: Number,
			required: true, // 原價
		},
		pickupDate: {
			type: Date,
			required: false,
		},
		bot: {
			type: String,
			required: false,
		},
		remark: {
			type: String,
			required: false,
		},
		soldPrice: {
			type: Number,
			default: 0,
			required: false,
		},
		status: {
			type: String,
			enum: ["pending", "hold", "sold"],
			default: "pending",
			required: false,
		},
		holdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: false,
		},
		holdDate: {
			type: Date,
			required: false,
		},
		holdExpireDuration: {
			type: Number, // minute
			default: 4320,
			required: false,
		},
		profit: {
			type: Number,
			default: 0,
			required: false,
		},
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: false,
		},
		updatedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
	},
	{
		timestamps: true,
	}
);

ticketSchema.pre("save", function (next) {
	if (this.soldPrice && this.price) {
		this.profit = this.soldPrice - this.price;
	}
	next();
});

const Ticket = mongoose.model("Ticket", ticketSchema);
module.exports = Ticket;
