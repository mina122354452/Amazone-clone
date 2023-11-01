const mongoose = require("mongoose");

let couponSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		unique: true,
		uppercase: true,
	},
	expiry: {
		type: Date,
		required: true,
	},
	discount: {
		type: Number,
		required: true,
	},
});

//Export the model
module.exports = mongoose.model("Coupon", couponSchema);
