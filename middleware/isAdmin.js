const isAdmin = (req, res, next) => {
	if (req.user?.role === "admin") {
		next();
	} else {
		res.status(403).json({ message: "Admin only" });
	}
};

module.exports = isAdmin;
