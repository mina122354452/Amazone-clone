const express = require("express");
const {
	createUser,
	loginUser,
	getallUser,
	getaUser,
	deleteaUser,
	updateUser,
	unblockUser,
	blockUser,
	handleRefreshToken,
	logout,
	updatePassword,
	forgotPasswordToken,
	resetPassword,
	loginAdmin,
	getWishList,
	saveAddress,
	userCart,
	getUserCart,
	emptyCart,
	applyCoupon,
	createOrder,
	getAllOrders,
	updateOrderStatus,
	getOrders,
	verifyEmailToken,
	verifyEmail,
	verifyMobileOtp,
	verifyMobile,
} = require("../controller/userCrtl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const router = express.Router();
router.post("/register", createUser);
router.post("/forgot-password-token", forgotPasswordToken);
router.post("/verify-email/", verifyEmailToken);
router.post("/verify-mobile/", verifyMobileOtp);

router.put("/reset-password/:token", resetPassword);
router.put("/Email-verification/:token", verifyEmail);
router.put("/mobile-verification/", verifyMobile);

router.put("/password", authMiddleware, updatePassword);
router.post("/login", loginUser);
router.post("/admin-login", loginAdmin);
router.post("/cart", authMiddleware, userCart);
router.post("/cart/applycoupon", authMiddleware, applyCoupon);
router.post("/cart/cash-order", authMiddleware, createOrder);
router.get("/all-users", getallUser);
router.get("/get-orders", authMiddleware, getOrders);
router.get("/getallorders", authMiddleware, isAdmin, getAllOrders);
router.get("/refresh", handleRefreshToken);
router.get("/logout", logout);

router.get("/wishlist", authMiddleware, getWishList);
router.get("/cart", authMiddleware, getUserCart);

router.get("/:id", authMiddleware, isAdmin, getaUser);
router.delete("/empty-cart", authMiddleware, emptyCart);
router.delete("/:id", deleteaUser);
router.put(
	"/order/update-order/:id",
	authMiddleware,
	isAdmin,
	updateOrderStatus
);
router.put("/edit-user", authMiddleware, updateUser);
router.put("/save-address", authMiddleware, saveAddress);
router.put("/block-user/:id", authMiddleware, isAdmin, blockUser);
router.put("/unblock-user/:id", authMiddleware, isAdmin, unblockUser);

module.exports = router;
