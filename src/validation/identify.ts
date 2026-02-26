import { z } from "zod";
import { IdentifyInput } from "../types/identify";

const identifySchema = z
  .object({
    email: z.union([z.string(), z.null()]).optional(),
    phoneNumber: z.union([z.string(), z.number(), z.null()]).optional(),
  })
  .superRefine((value, ctx) => {
    const hasEmail = typeof value.email === "string" && value.email.trim().length > 0;
    const hasPhone =
      (typeof value.phoneNumber === "string" && value.phoneNumber.trim().length > 0) ||
      typeof value.phoneNumber === "number";

    if (!hasEmail && !hasPhone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one of email or phoneNumber is required",
      });
    }
  });

export const parseIdentifyInput = (payload: unknown): IdentifyInput => {
  const parsed = identifySchema.parse(payload);

  const email =
    typeof parsed.email === "string" && parsed.email.trim().length > 0
      ? parsed.email.trim().toLowerCase()
      : null;

  const phoneNumber =
    typeof parsed.phoneNumber === "number"
      ? parsed.phoneNumber.toString()
      : typeof parsed.phoneNumber === "string" && parsed.phoneNumber.trim().length > 0
        ? parsed.phoneNumber.trim()
        : null;

  return { email, phoneNumber };
};
