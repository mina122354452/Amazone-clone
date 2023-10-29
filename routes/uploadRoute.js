const express = require("express");
const { uploadImages } = require("../controller/uploadCtrl");
const { isAdmin, authMiddleware } = require("../middlewares/authMiddleware");
const { uploadPhoto, productImgResize } = require("../middlewares/uploadImage");
const router = express.Router();

router.post(
	"/",
	authMiddleware,
	isAdmin,
	uploadPhoto.array("images", 10),
	productImgResize,
	uploadImages
);

module.exports = router;
