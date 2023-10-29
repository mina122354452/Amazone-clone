const expressAsyncHandler = require("express-async-handler");
const Category = require("../models/prodCategoryModel.js");
const validateMongoDbId = require("../utils/validateMongodbid");

const createCategory = expressAsyncHandler(async (req, res) => {
	try {
		const newCategory = await Category.create(req.body);
		res.json(newCategory);
	} catch (error) {
		throw new Error(error);
	}
});

const updateCategory = expressAsyncHandler(async (req, res) => {
	const { id } = req.params;
	validateMongoDbId(id);
	try {
		const updatedCategory = await Category.findByIdAndUpdate(id, req.body, {
			new: true,
		});
		res.json(updatedCategory);
	} catch (error) {
		throw new Error(error);
	}
});
const deleteCategory = expressAsyncHandler(async (req, res) => {
	const { id } = req.params;
	validateMongoDbId(id);
	try {
		const deletedCategory = await Category.findByIdAndDelete(id);
		res.json(deletedCategory);
	} catch (error) {
		throw new Error(error);
	}
});
const getCategory = expressAsyncHandler(async (req, res) => {
	const { id } = req.params;
	validateMongoDbId(id);
	try {
		const getaCategory = await Category.findById(id);
		res.json(getaCategory);
	} catch (error) {
		throw new Error(error);
	}
});
const getallCategory = expressAsyncHandler(async (req, res) => {
	try {
		const getallCategory = await Category.find();
		res.json(getallCategory);
	} catch (error) {
		throw new Error(error);
	}
});
module.exports = {
	createCategory,
	updateCategory,
	deleteCategory,
	getallCategory,
	getCategory,
};
