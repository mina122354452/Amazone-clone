const Blog = require("../models/blogModel");
const User = require("../models/userModel");
const expressAsyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongodbid");
const { cloudinaryUploadImg } = require("../utils/cloudinary");
const fs = require("fs");

const createBlog = expressAsyncHandler(async (req, res) => {
	try {
		const newBlog = await Blog.create(req.body);
		res.json(newBlog);
	} catch (error) {
		throw new Error(error);
	}
});
const updateBlog = expressAsyncHandler(async (req, res) => {
	const { id } = req.params;
	validateMongoDbId(id);

	try {
		const updateBlog = await Blog.findByIdAndUpdate(id, req.body, {
			new: true,
		});
		res.json(updateBlog);
	} catch (error) {
		throw new Error(error);
	}
});
const getaBlog = expressAsyncHandler(async (req, res) => {
	const { id } = req.params;
	validateMongoDbId(id);

	try {
		const getaBlog = await Blog.findById(id);
		const updatedViews = await Blog.findByIdAndUpdate(
			id,
			{
				$inc: { numViews: 1 },
			},
			{
				new: true,
			}
		)
			.populate("likes", "firstName lastName")
			.populate("dislikes", "firstName lastName");

		res.json(updatedViews);
	} catch (error) {
		throw new Error(error);
	}
});
const getAllBlogs = expressAsyncHandler(async (req, res) => {
	try {
		const getBlogs = await Blog.find()
			.populate("likes", "firstName lastName")
			.populate("dislikes", "firstName lastName");

		res.json(getBlogs);
	} catch (error) {
		throw new Error(error);
	}
});
const deleteBlog = expressAsyncHandler(async (req, res) => {
	const { id } = req.params;
	validateMongoDbId(id);
	try {
		const deleteBlog = await Blog.findByIdAndDelete(id, {
			new: true,
		});
		res.json(deleteBlog);
	} catch (error) {
		throw new Error(error);
	}
});

const liketheBlog = expressAsyncHandler(async (req, res) => {
	const { blogId } = req.body;
	console.log(blogId);
	validateMongoDbId(blogId);
	const blog = await Blog.findById(blogId);
	const loginUserId = req?.user._id;
	// TODO:Remove
	const isLiked = blog.isLiked;
	const aleardyDisliked = blog.dislikes?.find(
		(userId) => userId?.toString() === loginUserId?.toString()
	);
	const alreadyLiked = blog?.likes?.find(
		(userId) => userId?.toString() === loginUserId?.toString()
	);
	if (aleardyDisliked) {
		const blog = await Blog.findByIdAndUpdate(
			blogId,
			{
				$pull: { dislikes: loginUserId },
				isDisliked: false,
			},
			{
				new: true,
			}
		);
	}
	if (alreadyLiked) {
		const blog = await Blog.findByIdAndUpdate(
			blogId,
			{
				$pull: { likes: loginUserId },
				isLiked: false,
			},
			{
				new: true,
			}
		);
		res.json(blog);
	} else {
		const blog = await Blog.findByIdAndUpdate(
			blogId,
			{
				$push: { likes: loginUserId },
				isLiked: true,
			},
			{
				new: true,
			}
		);
		res.json(blog);
	}
});
const disliketheBlog = expressAsyncHandler(async (req, res) => {
	const { blogId } = req.body;
	validateMongoDbId(blogId);
	// Find the blog which you want to be liked
	const blog = await Blog.findById(blogId);
	// find the login user
	const loginUserId = req?.user?._id;
	// find if the user has liked the blog
	// TODO:Remove
	const isDisLiked = blog?.isDisliked;
	// find if the user has disliked the blog
	const alreadyLiked = blog?.likes?.find(
		(userId) => userId?.toString() === loginUserId?.toString()
	);
	const aleardyDisliked = blog.dislikes?.find(
		(userId) => userId?.toString() === loginUserId?.toString()
	);
	if (alreadyLiked) {
		const blog = await Blog.findByIdAndUpdate(
			blogId,
			{
				$pull: { likes: loginUserId },
				isLiked: false,
			},
			{ new: true }
		);
	}
	if (aleardyDisliked) {
		const blog = await Blog.findByIdAndUpdate(
			blogId,
			{
				$pull: { dislikes: loginUserId },
				isDisliked: false,
			},
			{ new: true }
		);
		res.json(blog);
	} else {
		const blog = await Blog.findByIdAndUpdate(
			blogId,
			{
				$push: { dislikes: loginUserId },
				isDisliked: true,
			},
			{ new: true }
		);
		res.json(blog);
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
		const findBlog = await Blog.findByIdAndUpdate(
			id,
			{
				images: urls.map((file) => {
					return file;
				}),
			},
			{
				new: true,
			}
		);
		res.json(findBlog);
	} catch (err) {
		console.log(req.files);
		throw new Error(err);
	}
});
module.exports = {
	createBlog,
	updateBlog,
	getaBlog,
	getAllBlogs,
	deleteBlog,
	liketheBlog,
	disliketheBlog,
	uploadImages,
};
