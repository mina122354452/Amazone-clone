const mongoose = require("mongoose");

let blogcategorySchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
	},
	{
		timestamps: true,
	}
);

//Export the model
module.exports = mongoose.model("BCategory", blogcategorySchema);
