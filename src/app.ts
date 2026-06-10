import cors from "cors";
import express from "express";
import morgan from "morgan";
import path from "node:path";
import { env } from "./config/env.js";
import { capturesRouter } from "./modules/captures/captures.routes.js";
import { errorHandler } from "./shared/middlewares/errorHandler.js";

export const app = express();

app.use(cors());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use("/uploads", express.static(path.resolve(env.UPLOAD_DIR)));

app.get("/", (_request, response) => {
  response.json({ status: "ok", service: "image-processing-server" });
});

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.use("/captures", capturesRouter);
app.use(errorHandler);

export default app;
