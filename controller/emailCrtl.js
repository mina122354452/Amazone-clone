const nodemailer = require("nodemailer");
const expressAsyncHandler = require("express-async-handler");

const sendEmail = expressAsyncHandler(async (data) => {
	const transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			// TODO: replace `user` and `pass` values from <https://forwardemail.net>
			user: process.env.Email,
			pass: process.env.password,
		},
	});
	const info = await transporter.sendMail({
		// FIXME: EDIT GMAIL
		from: '"E-Commerce Project" <Mbsshy2008@gmail.com>', // sender address
		to: data.to, // list of receivers
		subject: data.subject, // Subject line
		text: data.text, // plain text body
		html: data.html, // html body
	});
	// TODO:REMOVE LINE
	console.log("Message sent: %s", info.messageId);
});

module.exports = sendEmail;
