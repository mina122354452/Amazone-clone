const Brand = require("../models/brandModel");
const expressAsyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongodbId");

const createBrand = expressAsyncHandler(async (req, res) => {
	try {
		const newBrand = await Brand.create(req.body);
		res.json(newBrand);
	} catch (error) {
		throw new Error(error);
	}
});
const updateBrand = expressAsyncHandler(async (req, res) => {
	const { id } = req.params;
	validateMongoDbId(id);
	try {
		const updatedBrand = await Brand.findByIdAndUpdate(id, req.body, {
			new: true,
		});
		res.json(updatedBrand);
	} catch (error) {
		throw new Error(error);
	}
});
const deleteBrand = expressAsyncHandler(async (req, res) => {
	const { id } = req.params;
	validateMongoDbId(id);
	try {
		const deletedBrand = await Brand.findByIdAndDelete(id);
		res.json(deletedBrand);
	} catch (error) {
		throw new Error(error);
	}
});
const getBrand = expressAsyncHandler(async (req, res) => {
	const { id } = req.params;
	validateMongoDbId(id);
	try {
		const getaBrand = await Brand.findById(id);
		res.json(getaBrand);
	} catch (error) {
		throw new Error(error);
	}
});
const getallBrand = expressAsyncHandler(async (req, res) => {
	try {
		const getallBrand = await Brand.find();
		res.json(getallBrand);
	} catch (error) {
		throw new Error(error);
	}
});
module.exports = {
	createBrand,
	updateBrand,
	deleteBrand,
	getBrand,
	getallBrand,
};
