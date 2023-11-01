const expressAsyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Coupon = require("../models/couponModel");
const Order = require("../models/orderModel");
const { generateToken } = require("../config/jwt");
const validateMongoDbId = require("../utils/validateMongodbid");
const { generateRefreshToken } = require("../config/refreshToken");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const sendEmail = require("./emailCrtl");
const crypto = require("crypto");
const uniqid = require("uniqid");
const axios = require("axios");
const bcrypt = require("bcrypt");
const OTP = require("../models/UserOtpVerification");
const otpGen = require("otp-generator");
const _ = require("lodash");
const twilio = require("twilio");
const {
	generetePasswordResetMail,
	genereteVerifyMail,
} = require("../messages/email");

const createUser = expressAsyncHandler(async (req, res) => {
	const { firstname, lastname, email, mobile, password } = req.body;
	const findUser = await User.findOne({ email });
	if (!findUser) {
		const newUser = await User.create({
			firstname,
			lastname,
			email,
			mobile,
			password,
		});
		if (newUser.emailConfirm === false) {
			try {
				await axios.post(
					"http://localhost:3000/api/user/verify-email/",
					{ email: req.body.email, mobile: req.body.mobile }
				);
				return res
					.status(200)
					.send("we sent the verification to your email");
			} catch (error) {
				console.error("Failed to send POST request:", error);
				// Handle the error and inform the user accordingly
				return res
					.status(500)
					.send("Failed to verify your email.,try again");
			}
			// return res.send("your email isn't verified");
		} else if (newUser.mobileConfirm === false) {
			try {
				await axios.post(
					"http://localhost:3000/api/user/verify-mobile/",
					{ email: req.body.email, mobile: req.body.mobile }
				);
				return res
					.status(200)
					.send("we sent the otp code to your number");
			} catch (error) {
				console.error("Failed to send POST request:", error);
				// Handle the error and inform the user accordingly
				return res
					.status(500)
					.send("Failed to verify your number.,try again");
			}
		} else {
			console.log("t");

			return res.status(201).json({ message: "User created" });
		}
	} else {
		if (findUser.emailConfirm === false) {
			try {
				await axios.post(
					"http://localhost:3000/api/user/verify-email/",
					{ email: req.body.email }
				);
				return res
					.status(200)
					.send("we sent the verification to your email");
			} catch (error) {
				console.error("Failed to send POST request:", error);
				// Handle the error and inform the user accordingly
				return res
					.status(500)
					.send("Failed to verify your email.,try again");
			}
		} else if (findUser.mobileConfirm === false) {
			try {
				await axios.post(
					"http://localhost:3000/api/user/verify-mobile/",
					{ email: req.body.email, mobile: req.body.mobile }
				);
				return res
					.status(200)
					.send("we sent the otp code to your number");
			} catch (error) {
				console.error("Failed to send POST request:", error);
				// Handle the error and inform the user accordingly
				return res
					.status(500)
					.send("Failed to verify your number.,try again");
			}
		} else {
			throw new Error("user exist");
		}
	}
});

const loginUser = expressAsyncHandler(async (req, res) => {
	const { email, password } = req.body;
	const findUser = await User.findOne({ email });
	const passwordStatus = await findUser.isPasswordMatched(password);
	if (findUser && passwordStatus) {
		const refreshToken = await generateRefreshToken(findUser?.id);
		const updateUser = await User.findByIdAndUpdate(
			findUser?._id,
			{
				refreshToken: refreshToken,
			},
			{
				new: true,
			}
		);
		res.cookie("refreshToken", refreshToken, {
			httpOnly: true,
			sameSite: "strict",
			secure: true,
			maxAge: 72 * 60 * 60 * 1000,
		});
		res.json({
			id: findUser?._id,
			firstname: findUser?.firstName,
			lastname: findUser?.lastName,
			email: findUser?.email,
			mobile: findUser?.mobile,
			token: generateToken(findUser?._id),
		});
	} else {
		throw new Error("Invalid credentials");
	}
});

const verifyEmailToken = expressAsyncHandler(async (req, res) => {
	const { email } = req.body;
	console.log(req.body);

	const user = await User.findOne({ email });

	if (!user) throw new Error("User Not Found With this email");
	try {
		if (user.emailConfirm === false) {
			const token = await user.verifyEmail();
			await user.save();
			// todo
			let mail = await genereteVerifyMail(
				token,
				user.firstname,
				user.lastname
			);
			console.log(token);
			const data = {
				to: email,
				subject: "verify your Email",
				html: mail,
			};
			await sendEmail(data);
			res.json(token);
		} else if (user.mobileConfirm === false) {
			console.log("s");
			try {
				await axios.post(
					"http://localhost:3000/api/user/verify-mobile/",
					{
						email: req.body.email,
						mobile: req.body.mobile,
					}
				);
				return res
					.status(200)
					.send("we sent the otp code to your number");
			} catch (error) {
				console.error("Failed to send POST request:", error);
				// Handle the error and inform the user accordingly
				return res
					.status(500)
					.send("Failed to verify your number.,try again");
			}
		} else {
			res.send("your email is verified");
		}
	} catch (error) {
		throw new Error(error);
	}
});
const verifyEmail = expressAsyncHandler(async (req, res) => {
	const { token } = req.params;
	const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
	const user = await User.findOne({
		emailVerify: hashedToken,
		emailVerifyExpires: {
			$gt: Date.now(),
		},
	});
	if (!user) throw new Error("token Expired,please try again later");
	user.emailConfirm = true;
	user.emailVerify = undefined;
	user.emailVerifyExpires = undefined;
	await user.save();
	if (user.mobileConfirm === false) {
		try {
			await axios.post("http://localhost:3000/api/user/verify-mobile/", {
				email: user.email,
				mobile: user.mobile,
			});
			return res.status(200).send("we sent the otp code to your number");
		} catch (error) {
			console.error("Failed to send POST request:", error);
			// Handle the error and inform the user accordingly
			return res
				.status(500)
				.send("Failed to verify your number.,try again");
		}
	} else if (user.mobileConfirm === true && user.emailConfirm === true) {
		res.json("user created successfully");
	}
});
const verifyMobileOtp = expressAsyncHandler(async (req, res) => {
	const { mobile, email } = req.body;
	console.log(req.body);

	const user = await User.findOne({ mobile });

	if (!user) throw new Error("User Not Found With this number");
	try {
		if (user.emailConfirm === false) {
			try {
				await axios.post(
					"http://localhost:3000/api/user/verify-email/",
					{ email: email }
				);
				return res
					.status(200)
					.send("we sent the verification to your email");
			} catch (error) {
				console.error("Failed to send POST request:", error);
				// Handle the error and inform the user accordingly
				return res
					.status(500)
					.send("Failed to verify your email.,try again");
			}
		} else if (user.mobileConfirm === false) {
			// FIXME: REDIRECT
			const Otp = otpGen.generate(6, {
				digits: true,
				lowerCaseAlphabets: false,
				upperCaseAlphabets: false,
				specialChars: false,
			});
			console.log(Otp);
			async function sendOtp() {
				const client = new twilio(
					process.env.SID,
					process.env.twilio_auth
				);
				return client.messages
					.create({
						body: `Your otp is ${Otp}`,
						from: "+12562861553",
						to: mobile,
					})
					.then((message) => {
						console.log(message);
					})
					.catch((err) => console.log(err));
			}
			sendOtp();
			const otp = new OTP({ number: mobile, otp: Otp });
			const salt = await bcrypt.genSalt(10);
			otp.otp = await bcrypt.hash(otp.otp, salt);
			const result = await otp.save();
			return res.status(200).send("Otp send successfully");
		} else {
			res.send("your number is verified");
		}
	} catch (error) {
		throw new Error(error);
	}
});
const verifyMobile = expressAsyncHandler(async (req, res) => {
	const { number, otp } = req.body;
	console.log(number, otp);
	const user = await User.findOne({ mobile: number });
	const otpHolder = await OTP.find({
		number: number,
	});
	if (!otpHolder) throw new Error("otp Expired,please try again later");
	const rightOtpFind = otpHolder[otpHolder.length - 1];
	const vaildUser = await bcrypt.compare(otp, rightOtpFind.otp);
	if (rightOtpFind.number === number && vaildUser) {
		user.mobileConfirm = true;
		user.save();
		console.log(user.mobileConfirm);
		await OTP.deleteMany({
			number: number,
		});
	} else {
		throw new Error("otp wrong");
	}

	if (user.emailConfirm === false) {
		try {
			await axios.post("http://localhost:3000/api/user/verify-email/", {
				email: email,
			});
			return res
				.status(200)
				.send("we sent the verification to your email");
		} catch (error) {
			console.error("Failed to send POST request:", error);
			// Handle the error and inform the user accordingly
			return res
				.status(500)
				.send("Failed to verify your email.,try again");
		}
	} else if (user.mobileConfirm === true && user.emailConfirm === true) {
		res.json("user created successfully");
	}
});
const loginAdmin = expressAsyncHandler(async (req, res) => {
	const { email, password } = req.body;
	const findAdmin = await User.findOne({ email });
	if (findAdmin.role !== "admin") throw new Error("Not Authorized");
	const passwordStatus = await findAdmin.isPasswordMatched(password);
	if (findAdmin && passwordStatus) {
		const refreshToken = await generateRefreshToken(findAdmin?.id);
		const updateUser = await User.findByIdAndUpdate(
			findAdmin?._id,
			{
				refreshToken: refreshToken,
			},
			{
				new: true,
			}
		);
		res.cookie("refreshToken", refreshToken, {
			httpOnly: true,
			sameSite: "strict",
			secure: true,
			maxAge: 72 * 60 * 60 * 1000,
		});
		res.json({
			id: findAdmin?._id,
			firstname: findAdmin?.firstName,
			lastname: findAdmin?.lastName,
			email: findAdmin?.email,
			mobile: findAdmin?.mobile,
			token: generateToken(findAdmin?._id),
		});
	} else {
		throw new Error("Invalid credentials");
	}
});

const handleRefreshToken = expressAsyncHandler(async (req, res) => {
	let cookie = await req.cookies;
	console.log(cookie);
	if (!cookie?.refreshToken) {
		throw new Error("No refresh token in cookies");
	}
	const refreshToken = cookie.refreshToken;

	const user = await User.findOne({
		refreshToken,
	});
	if (!user) throw new Error("No refresh token in db or matched");
	jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
		if (err || user.id !== decoded.id) {
			throw new Error("Refresh token is not valid");
		}
		const accessToken = generateToken(user?._id);
		res.json({ accessToken });
	});
});

const logout = expressAsyncHandler(async (req, res) => {
	const cookie = req.cookies;
	if (!cookie?.refreshToken) {
		throw new Error("No refresh token in cookies");
	}
	const refreshToken = cookie.refreshToken;
	const user = await User.findOne({
		refreshToken,
	});
	if (!user) {
		res.clearCookie("refreshToken", {
			httpOnly: true,

			secure: true,
		});
		return res.sendStatus(204);
	}
	await User.findOneAndUpdate(
		{ refreshToken },
		{
			refreshToken: "",
		}
	);
	res.clearCookie("refreshToken", {
		httpOnly: true,
		secure: true,
	});
	return res.sendStatus(204);
});

const getallUser = expressAsyncHandler(async (req, res) => {
	try {
		const getUsers = await User.find();
		res.json(getUsers);
	} catch (err) {
		throw new Error(err);
	}
});

const getaUser = expressAsyncHandler(async (req, res) => {
	const { id } = req.params;
	validateMongoDbId(id);

	try {
		const getaUser = await User.findById(id);
		res.json({ getaUser });
	} catch (err) {
		throw new Error(err);
	}
});

const deleteaUser = expressAsyncHandler(async (req, res) => {
	const { id } = req.params;
	validateMongoDbId(id);

	try {
		const deleteaUser = await User.findByIdAndDelete(id);
		res.json({ deleteaUser });
	} catch (err) {
		throw new Error(err);
	}
});

const updateUser = expressAsyncHandler(async (req, res) => {
	const { id } = req.user;
	validateMongoDbId(id);
	try {
		const updateUser = await User.findByIdAndUpdate(
			id,
			{
				firstName: req?.body?.firstName,
				lastName: req?.body?.lastName,
				email: req?.body?.email,
				mobile: req?.body?.mobile,
			},
			{
				new: true,
				runValidators: true,
			}
		);
		res.json(updateUser);
	} catch (error) {
		throw new Error(error);
	}
});

const blockUser = expressAsyncHandler(async (req, res) => {
	const { id } = req.params;
	validateMongoDbId(id);

	try {
		const block = await User.findByIdAndUpdate(
			id,
			{
				isBlocked: true,
			},
			{
				new: true,
			}
		);
		res.json({ message: "User Blocked" });
	} catch (err) {
		throw new Error(err);
	}
});
const unblockUser = expressAsyncHandler(async (req, res) => {
	const { id } = req.params;
	validateMongoDbId(id);

	try {
		const block = await User.findByIdAndUpdate(
			id,
			{
				isBlocked: false,
			},
			{
				new: true,
			}
		);
		res.json({ message: "User unBlocked" });
	} catch (err) {
		throw new Error(err);
	}
});

const updatePassword = expressAsyncHandler(async (req, res) => {
	const { _id } = req.user;
	const { password } = req.body;
	validateMongoDbId(_id);
	const user = await User.findById(_id);
	if (password) {
		user.password = password;
		user.passwordChangedAt = Date.now();
		const updatedPassword = await user.save();
		res.json(updatedPassword);
	} else {
		res.json(user);
	}
});
const forgotPasswordToken = expressAsyncHandler(async (req, res) => {
	const { email } = req.body;
	const user = await User.findOne({ email });
	if (!user) throw new Error("User Not Found With this email");
	try {
		const token = await user.createPasswordResetToken();
		await user.save();
		// todo
		let mail = await generetePasswordResetMail(
			token,
			user.firstname,
			user.lastname
		);
		console.log(token);
		const data = {
			to: email,
			subject: "Reset Password link",
			html: mail,
		};
		await sendEmail(data);
		// TODO: EDIT RESPONSE
		res.json(token);
	} catch (error) {
		throw new Error(error);
	}
});
const resetPassword = expressAsyncHandler(async (req, res) => {
	const { password } = req.body;
	const { token } = req.params;
	const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
	const user = await User.findOne({
		passwordResetToken: hashedToken,
		passwordResetExpires: {
			$gt: Date.now(),
		},
	});
	if (!user) throw new Error("token Expired,please try again later");
	user.password = password;
	user.passwordChangedAt = Date.now();
	user.passwordResetToken = undefined;
	user.passwordResetExpires = undefined;
	await user.save();
	res.json(user);
});

const getWishList = expressAsyncHandler(async (req, res) => {
	const { _id } = req.user;
	validateMongoDbId(_id);
	try {
		const findUser = await User.findById(_id).populate("wishlist");
		res.json(findUser);
	} catch (err) {
		throw new Error(err);
	}
});

const saveAddress = expressAsyncHandler(async (req, res) => {
	const { _id } = req.user;
	validateMongoDbId(_id);
	if (
		!req.body.country ||
		!req.body.city ||
		!req.body.state ||
		!req.body.street ||
		!req.body.postcode ||
		!req.body.Block ||
		!req.body.floor ||
		!req.body.apartment
	) {
		throw new Error("complete address please");
	}

	try {
		const updatedUser = await User.findByIdAndUpdate(
			_id,
			{
				address: req?.body,
			},
			{
				new: true,
			}
		);
		res.json(updatedUser);
	} catch (error) {
		throw new Error(error);
	}
});

const userCart = expressAsyncHandler(async (req, res) => {
	const { cart } = req.body;
	const { _id } = req.user;
	validateMongoDbId(_id);
	const user = await User.findById(_id);

	try {
		let alreadyExistCart = await Cart.findOne({ orderby: user._id });

		if (!alreadyExistCart) {
			// If the cart doesn't exist, create a new one
			alreadyExistCart = new Cart({
				products: [],
				cartTotal: 0,
				orderby: user?._id,
			});
		}

		for (const cartProduct of cart) {
			validateMongoDbId(cartProduct._id);
			const existingProduct = alreadyExistCart.products.find((product) =>
				product.product.equals(cartProduct._id)
			);

			if (existingProduct) {
				// If the product exists in the existing cart, increment the count
				existingProduct.count += cartProduct.count;
			} else {
				let price = await Product.findById(cartProduct._id)
					.select("price")
					.exec();

				// If the product is not in the existing cart, add it
				alreadyExistCart.products.push({
					product: cartProduct._id,
					count: cartProduct.count,
					color: cartProduct.color,
					price: price.price,
				});
			}
		}

		// Calculate the updated cartTotal
		alreadyExistCart.cartTotal = alreadyExistCart.products.reduce(
			(total, product) => total + product.price * product.count,
			0
		);

		// Save the updated cart (either newly created or updated)
		const updatedCart = await alreadyExistCart.save();
		res.json(updatedCart);
	} catch (err) {
		throw new Error(err);
	}
});
const getUserCart = expressAsyncHandler(async (req, res) => {
	const { _id } = req.user;
	validateMongoDbId(_id);
	try {
		const cart = await Cart.findOne({ orderby: _id }).populate(
			"products.product"
		);
		res.json(cart);
	} catch (error) {
		throw new Error(error);
	}
});
const emptyCart = expressAsyncHandler(async (req, res) => {
	const { _id } = req.user;
	validateMongoDbId(_id);
	try {
		const user = await User.findOne({ _id });
		const cart = await Cart.findOneAndRemove({ orderby: user._id });
		res.json(cart);
	} catch (error) {
		throw new Error(error);
	}
});

const applyCoupon = expressAsyncHandler(async (req, res) => {
	const { coupon } = req.body;
	const { _id } = req.user;
	validateMongoDbId(_id);
	const validCoupon = await Coupon.findOne({ name: coupon });
	if (validCoupon === null) {
		throw new Error("Invalid coupon");
	}
	const user = await User.findOne({ _id });
	let { products, cartTotal } = await Cart.findOne({
		orderby: user._id,
	}).populate("products.product");
	let totalAfterDiscount = (
		cartTotal -
		(cartTotal * validCoupon.discount) / 100
	).toFixed(2);
	await Cart.findOneAndUpdate(
		{ orderby: user._id },
		{
			totalAfterDiscount,
		},
		{
			new: true,
		}
	);
	res.json(totalAfterDiscount);
});

const createOrder = expressAsyncHandler(async (req, res) => {
	const { COD, couponApplied } = req.body;
	const { _id } = req.user;
	validateMongoDbId(_id);
	try {
		if (!COD) throw new Error("");
		const user = await User.findById(_id);
		let userCart = await Cart.findOne({ orderby: user._id });
		let finalAmount = 0;
		if (couponApplied && userCart.totalAfterDiscount) {
			finalAmount = userCart.totalAfterDiscount;
		} else {
			finalAmount = userCart.cartTotal;
		}
		console.log(finalAmount);
		let newOrder = await new Order({
			products: userCart.products,
			paymentIntent: {
				id: uniqid(),
				method: "COD",
				amount: finalAmount,
				status: "Cash on Delivery",
				created: Date.now(),
				currency: "usd",
			},
			orderby: user._id,
			orderStatus: "Cash on Delivery",
		}).save();
		let update = userCart.products.map((item) => {
			return {
				updateOne: {
					filter: { _id: item.product._id },
					update: {
						$inc: { quantity: -item.count, sold: +item.count },
					},
				},
			};
		});
		const updated = await Product.bulkWrite(update, {});
		res.json({ message: "success" });

		const cart = await Cart.findOneAndRemove({ orderby: user._id });
	} catch (err) {
		throw new Error(err);
	}
});
const getOrders = expressAsyncHandler(async (req, res) => {
	const { _id } = req.user;
	validateMongoDbId(_id);
	try {
		const userorders = await Order.findOne({ orderby: _id })
			.populate("products.product")
			.populate("orderby")
			.exec();
		res.json(userorders);
	} catch (error) {
		throw new Error(error);
	}
});
const getAllOrders = expressAsyncHandler(async (req, res) => {
	try {
		const alluserorders = await Order.find()
			.populate("products.product")
			.populate("orderby")
			.exec();
		res.json(alluserorders);
	} catch (error) {
		throw new Error(error);
	}
});

const updateOrderStatus = expressAsyncHandler(async (req, res) => {
	const { status } = req.body;
	const { id } = req.params;
	validateMongoDbId(id);
	try {
		const updateOrderStatus = await Order.findByIdAndUpdate(
			id,
			{
				orderStatus: status,
				paymentIntent: {
					status: status,
				},
			},
			{ new: true }
		);
		res.json(updateOrderStatus);
	} catch (error) {
		throw new Error(error);
	}
});
module.exports = {
	createUser,
	loginUser,
	verifyEmailToken,
	verifyEmail,
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
	verifyMobileOtp,
	verifyMobile,
};
