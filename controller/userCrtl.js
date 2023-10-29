const expressAsyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const { generateToken } = require("../config/jwt");
const validateMongoDbId = require("../utils/validateMongodbid");
const { generateRefreshToken } = require("../config/refreshToken");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const sendEmail = require("./emailCrtl");
const crypto = require("crypto");
const generetePasswordResetMail = require("../email/ResetPass");

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

		return res.status(201).json({ message: "User created" });
	} else {
		throw new Error("user exist");
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
		const updatedPassword = await user.save();
		res.json(updatedPassword);
	} else {
		res.json(user);
	}
});
const forgotPasswordToken = expressAsyncHandler(async (req, res) => {
	const { email } = req.body;
	const user = await User.findOne({ email });
	console.log(user.firstName);
	if (!user) throw new Error("User Not Found With this email");
	try {
		const token = await user.createPasswordResetToken();
		await user.save();
		// todo
		let mail = await generetePasswordResetMail(
			token,
			user.firstName,
			user.lastName
		);
		console.log(token);
		const data = {
			to: email,
			subject: "Reset Password link",
			html: mail,
		};
		await sendEmail(data);
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
	user.passwordResetToken = undefined;
	user.passwordResetExpires = undefined;
	await user.save();
	res.json(user);
});

module.exports = {
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
};
