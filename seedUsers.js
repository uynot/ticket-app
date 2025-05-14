const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

require("dotenv").config();
mongoose.connect(process.env.MONGO_URI).then(async () => {
	const users = [
		{
			name: "Admin 測試",
			email: "admin@demo.com",
			password: await bcrypt.hash("admin123", 10),
			role: "admin",
		},
		{
			name: "User 測試 A",
			email: "user1@demo.com",
			password: await bcrypt.hash("user123", 10),
			role: "user",
		},
		{
			name: "User 測試 B",
			email: "user2@demo.com",
			password: await bcrypt.hash("user123", 10),
			role: "user",
		},
	];

	await User.deleteMany(); // 清空測試用戶
	await User.insertMany(users);
	console.log("Test Users built");
	process.exit();
});
