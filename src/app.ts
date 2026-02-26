import express from "express";
import { errorHandler } from "./middleware/error-handler";
import { identifyRouter } from "./routes/identify";

export const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

app.use("/identify", identifyRouter);

app.use(errorHandler);
