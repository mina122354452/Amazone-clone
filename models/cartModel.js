const mongoose = require("mongoose");

let cartSchema = new mongoose.Schema(
	{
		products: [
			{
				product: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Product",
				},
				count: Number,
				color: String,
				price: Number,
			},
		],
		cartTotal: Number,
		totalAfterDiscount: Number,
		orderby: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
	},
	{
		timestamps: true,
	},
	{
		toObject: { virtuals: true }, // Enable toObject option
	}
);

module.exports = mongoose.model("Cart", cartSchema);
