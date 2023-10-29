const Product = require("../models/productModel");
const expressAsyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongodbid");
const slugify = require("slugify");
const User = require("../models/userModel");
const { cloudinaryUploadImg } = require("../utils/cloudinary");
const fs = require("fs");
const createProduct = expressAsyncHandler(async (req, res) => {
	try {
		if (req.body.title) {
			req.body.slug = slugify(req.body.title);
		}
		const product = await Product.create(req.body);
		res.status(201).send({
			message: "Created a new product",
			data: product,
		});
	} catch (err) {
		throw new Error(err);
	}
});

const updateProduct = expressAsyncHandler(async (req, res) => {
	const { id } = req.params;
	validateMongoDbId(id);
	try {
		if (req.body.title) {
			req.body.slug = slugify(req.body.title);
		}
		const product = await Product.findByIdAndUpdate(id, req.body, {
			new: true,
		});
		res.json({ product });
	} catch (err) {
		throw new Error(err);
	}
});

const getaProduct = expressAsyncHandler(async (req, res) => {
	const { id } = req.params;
	validateMongoDbId(id);
	try {
		const findProduct = await Product.findById(id);
		res.json({ product: findProduct });
	} catch (err) {
		throw new Error(err);
	}
});

const getAllProduct = expressAsyncHandler(async (req, res) => {
	try {
		// Filtering
		const queryObj = { ...req.query };
		const excludeFields = ["page", "sort", "limit", "fields"];
		excludeFields.forEach((el) => delete queryObj[el]);
		let queryStr = JSON.stringify(queryObj);
		queryStr = queryStr.replace(
			/\b(gte|gt|lte|lt)\b/g,
			(match) => `$${match}`
		);

		let query = Product.find(JSON.parse(queryStr));

		// Sorting

		if (req.query.sort) {
			const sortBy = req.query.sort.split(",").join(" ");
			query = query.sort(sortBy);
		} else {
			query = query.sort("-createdAt");
		}

		// limiting the fields

		if (req.query.fields) {
			const fields = req.query.fields.split(",").join(" ");
			query = query.select(fields);
		} else {
			query = query.select("-__v");
		}

		// pagination

		const page = req.query.page;
		const limit = req.query.limit;
		const skip = (page - 1) * limit;
		query = query.skip(skip).limit(limit);
		if (req.query.page) {
			const productCount = await Product.countDocuments();
			if (skip >= productCount)
				throw new Error("This Page does not exists");
		}
		const product = await query;
		res.json(product);
	} catch (error) {
		throw new Error(error);
	}
});

const deleteProduct = expressAsyncHandler(async (req, res) => {
	const { id } = req.params;
	validateMongoDbId(id);
	try {
		const deleteProduct = await Product.findByIdAndDelete(id);
		res.json({ message: "Product deleted successfully" });
	} catch (err) {
		throw new Error(err);
	}
});

const addToWishList = expressAsyncHandler(async (req, res) => {
	const { _id } = req.user;
	const { prodId } = req.body;
	try {
		const user = await User.findById(_id);
		const alreadyadded = user.wishlist.find(
			(id) => id.toString() === prodId
		);
		if (alreadyadded) {
			let user = await User.findByIdAndUpdate(
				_id,
				{
					$pull: { wishlist: prodId },
				},
				{
					new: true,
				}
			);
			res.json(user);
		} else {
			let user = await User.findByIdAndUpdate(
				_id,
				{
					$push: { wishlist: prodId },
				},
				{
					new: true,
				}
			);
			res.json(user);
		}
	} catch (error) {
		throw new Error(error);
	}
});

const rating = expressAsyncHandler(async (req, res) => {
	const { _id } = req.user;
	const { star, prodId, comment } = req.body;
	try {
		const product = await Product.findById(prodId);
		let alreadyRated = product.ratings.find(
			(userId) => userId.postedby.toString() === _id.toString()
		);
		if (alreadyRated) {
			const updateRating = await Product.updateOne(
				{
					ratings: { $elemMatch: alreadyRated },
				},
				{
					$set: {
						"ratings.$.star": star,
						"ratings.$.comment": comment,
					},
				},
				{
					new: true,
				}
			);
		} else {
			const rateProduct = await Product.findByIdAndUpdate(
				prodId,
				{
					$push: {
						ratings: {
							star: star,
							comment: comment,
							postedby: _id,
						},
					},
				},
				{
					new: true,
				}
			);
		}
		const getallratings = await Product.findById(prodId);
		let totalRating = getallratings.ratings.length;
		let ratingsum = getallratings.ratings
			.map((item) => item.star)
			.reduce((prev, curr) => prev + curr, 0);
		let actualRating = Math.round(ratingsum / totalRating);
		let finalproduct = await Product.findByIdAndUpdate(
			prodId,
			{
				totalrating: actualRating,
			},
			{ new: true }
		);
		res.json(finalproduct);
	} catch (error) {
		throw new Error(error);
	}
});

const uploadImages = expressAsyncHandler(async (req, res) => {
	const { id } = req.params;
	validateMongoDbId(id);
	try {
		const uploader = (path) => cloudinaryUploadImg(path, "images");
		const urls = [];
		const files = req.files;

		for (let file of files) {
			const { path } = file;
			const newPath = await uploader(path);
			urls.push(newPath);
			fs.unlinkSync(path);
		}
		const findProduct = await Product.findByIdAndUpdate(
			id,
			{
				// FIXME: change logic of function
				//$push: { images: { $each: urls } },

				images: urls.map((file) => {
					return file;
				}),
			},
			{
				new: true,
			}
		);
		res.json(findProduct);
	} catch (err) {
		throw new Error(err);
	}
});

module.exports = {
	createProduct,
	getaProduct,
	getAllProduct,
	updateProduct,
	deleteProduct,
	addToWishList,
	rating,
	uploadImages,
};
