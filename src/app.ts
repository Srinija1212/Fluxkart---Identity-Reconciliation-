import express from "express";
import path from "path";
import { errorHandler } from "./middleware/error-handler";
import { identifyRouter } from "./routes/identify";

export const app = express();

app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

app.use("/identify", identifyRouter);

app.use(errorHandler);
