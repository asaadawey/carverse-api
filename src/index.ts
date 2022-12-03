import express from "express";
import errorMiddleware from "./middleware/error.middleware";

import userRouter from "./routes/users.route";
import moduleRouter from "./routes/modules.route";
import serviceRouter from "./routes/service.route";
import packageRouter from "./routes/package.route";
import authMiddleware from "./middleware/auth.middleware";
import providerRouter from "./routes/provider.route";
import carRouter from "./routes/cars.routes";
import orderRouter from "./routes/orders.route";

import io from "./web-socket/index";
import http from "http";
import path from "path";

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  //@ts-ignore
  res.io = io;
  next();
});

app.use(userRouter);
app.use(moduleRouter);
app.use(serviceRouter);
app.use(packageRouter);
app.use(providerRouter);
app.use(carRouter);
app.use(orderRouter);

app.use("/icons", [
  authMiddleware,
  express.static(path.join(process.cwd(), "public", "icons")),
]);

app.use(errorMiddleware);

const server = http.createServer(app);

io.listen(server);

server.listen(port, () => {
  console.log(`Port : ${port} Listen start at ${new Date().toISOString()}`);
});
