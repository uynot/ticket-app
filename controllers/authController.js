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

module.exports = { loginUser };
