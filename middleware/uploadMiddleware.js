const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, "uploads/"),
	filename: (req, file, cb) => {
		const uniqueName = `${Date.now()}-${file.originalname}`;
		cb(null, uniqueName);
	},
});

const fileFilter = (req, file, cb) => {
	const ext = path.extname(file.originalname);
	if (ext !== ".csv") {
		return cb(new Error("Only CSV files are allowed"), false);
	}
	cb(null, true);
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
