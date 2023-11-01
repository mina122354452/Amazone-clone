const express = require("express");
const dbConnect = require("./config/dbConnect");
const cookieParser = require("cookie-parser");
const app = express();
require("express-async-handler");
const dotenv = require("dotenv").config();
const PORT = process.env.PORT || 3000;
const authRoute = require("./routes/authRoute");
const productRoute = require("./routes/productRoute");
const BlogRoute = require("./routes/blogRoute");
const prodcategoryRoute = require("./routes/prodcategoryRoute");
const blogCatRoute = require("./routes/blogcatRoute");
const brandRouter = require("./routes/brandRoute");
const couponRoute = require("./routes/couponRoute");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const morgan = require("morgan");
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use("/api/user", authRoute);
app.use("/api/product", productRoute);
app.use("/api/blog", BlogRoute);
app.use("/api/category", prodcategoryRoute);
app.use("/api/blogcategory", blogCatRoute);
app.use("/api/brand", brandRouter);
app.use("/api/coupon", couponRoute);

app.use(notFound);
app.use(errorHandler);

async function start() {
	try {
		await dbConnect(process.env.MONGODB_URL);
		app.listen(PORT, () => {
			console.log(`Server is running on http://localhost:${PORT}`);
		});
	} catch {
		(err) => {
			console.log(err);
		};
	}
}
start();

// const express = require("express");
// const dbConnect = require("./config/dbConnect");
// const cookieParser = require("cookie-parser");
// const cluster = require("cluster");
// const numCPUs = require("os").cpus().length;

// if (cluster.isMaster) {
// 	// Fork workers for each CPU core
// 	for (let i = 0; i < numCPUs; i++) {
// 		cluster.fork();
// 	}

// 	cluster.on("exit", (worker, code, signal) => {
// 		console.log(`Worker ${worker.process.pid} died`);
// 	});
// } else {
// 	const app = express();
// 	require("express-async-handler");
// 	const dotenv = require("dotenv").config();
// 	const PORT = process.env.PORT || 3000;
// 	const authRoute = require("./routes/authRoute");
// 	const productRoute = require("./routes/productRoute");
// 	const BlogRoute = require("./routes/blogRoute");
// 	const prodcategoryRoute = require("./routes/prodcategoryRoute");
// 	const blogCatRoute = require("./routes/blogcatRoute");
// 	const brandRouter = require("./routes/brandRoute");
// 	const couponRoute = require("./routes/couponRoute");
// 	const { notFound, errorHandler } = require("./middlewares/errorHandler");
// 	const morgan = require("morgan");

// 	app.use(morgan("dev"));
// 	app.use(express.json());
// 	app.use(express.urlencoded({ extended: false }));
// 	app.use(cookieParser());
// 	app.use("/api/user", authRoute);
// 	app.use("/api/product", productRoute);
// 	app.use("/api/blog", BlogRoute);
// 	app.use("/api/category", prodcategoryRoute);
// 	app.use("/api/blogcategory", blogCatRoute);
// 	app.use("/api/brand", brandRouter);
// 	app.use("/api/coupon", couponRoute);

// 	app.use(notFound);
// 	app.use(errorHandler);

// 	async function start() {
// 		try {
// 			await dbConnect(process.env.MONGODB_URL);
// 			app.listen(PORT, () => {
// 				console.log(
// 					`Worker ${cluster.worker.id} is running on http://localhost:${PORT}`
// 				);
// 			});
// 		} catch (err) {
// 			console.error(err);
// 		}
// 	}

// 	start();
// }
