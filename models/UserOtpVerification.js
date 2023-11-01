const mongoose = require("mongoose");
const userOtpVerification = new mongoose.Schema(
	{
		number: {
			type: String,
			required: true,
		},
		otp: {
			type: String,
			require: true,
		},
		createdAt: { type: Date, default: Date.now(), index: { expires: 300 } },
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model("OTPS", userOtpVerification);
