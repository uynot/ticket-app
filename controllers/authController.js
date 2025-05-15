const User = require("../models/User");
const jwt = require("jsonwebtoken");

const loginUser = async (req, res) => {
	try {
		const { email, password } = req.body;

		const user = await User.findOne({ email });
		if (!user) return res.status(401).json({ message: "User not found" });

		const isMatch = await user.matchPassword(password);
		if (!isMatch) return res.status(401).json({ message: "Invalid password" });

		const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
			expiresIn: "7d",
		});

		res.json({
			token,
			user: {
				name: user.name,
				email: user.email,
				role: user.role,
			},
		});
	} catch (error) {
		res.status(500).json({ message: "Login error", error: error.message });
	}
};

const changePassword = async (req, res) => {
	try {
		const { currentPassword, newPassword } = req.body;
		const user = await User.findById(req.user._id);
		if (!user) return res.status(404).json({ message: "User not found" });

		const isMatch = await user.matchPassword(currentPassword);
		if (!isMatch) return res.status(400).json({ message: "Current password incorrect" });

		if (currentPassword === newPassword)
			return res.status(400).json({ message: "New password cannot be the same as the current password" });

		user.password = newPassword;
		await user.save();
		res.json({ message: "Password changed successfully" });
	} catch (error) {
		res.status(500).json({ message: "Error changing password", error: error.message });
	}
};

const getMe = (req, res) => {
	if (!req.user) return res.status(401).json({ message: "Not authenticated" });
	const { _id, name, email, role } = req.user;
	res.json({ _id, name, email, role });
};

module.exports = { loginUser, changePassword, getMe };
