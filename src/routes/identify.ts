import { Router } from "express";
import { identifyContact } from "../services/identity";
import { parseIdentifyInput } from "../validation/identify";

export const identifyRouter = Router();

identifyRouter.post("/", async (req, res, next) => {
  try {
    const input = parseIdentifyInput(req.body);
    const response = await identifyContact(input);

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});
