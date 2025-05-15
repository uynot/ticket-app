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
		row: {
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
			required: true, // official price
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
		soldBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: false,
		},
		soldDate: {
			type: Date,
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
		isDeleted: {
			type: Boolean,
			default: false,
			required: true,
		},
		deletedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			default: null,
			required: false,
		},
		deletedDate: {
			type: Date,
			default: null,
			required: false,
		},
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: false,
		},
		createdDate: {
			type: Date,
			required: false,
		},
		updatedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: false,
		},
		updatedDate: {
			type: Date,
			required: false,
		},
	},
	{
		timestamps: false,
		versionKey: false,
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
