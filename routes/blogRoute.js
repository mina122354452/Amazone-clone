const express = require("express");
const {
	createBlog,
	updateBlog,
	getaBlog,
	getAllBlogs,
	deleteBlog,
	liketheBlog,
	disliketheBlog,
	uploadImages,
} = require("../controller/blogCrtl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const { blogImgResize, uploadPhoto } = require("../middlewares/uploadImage");
const router = express.Router();

module.exports = router;

router.post("/", authMiddleware, isAdmin, createBlog);
router.put(
	"/uploads/:id",
	authMiddleware,
	isAdmin,
	uploadPhoto.array("images", 2),
	blogImgResize,
	uploadImages
);
router.put("/likes", authMiddleware, liketheBlog);
router.put("/dislikes", authMiddleware, disliketheBlog);

router.put("/:id", authMiddleware, isAdmin, updateBlog);

router.get("/:id", getaBlog);
router.get("/", getAllBlogs);

router.delete("/:id", authMiddleware, isAdmin, deleteBlog);

module.exports = router;
