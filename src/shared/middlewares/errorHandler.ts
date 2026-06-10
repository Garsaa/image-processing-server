import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError.js";

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error?.type === "entity.too.large") {
    return response.status(413).json({
      error: "Image exceeds maximum allowed size"
    });
  }

  if (error instanceof AppError) {
    return response.status(error.statusCode).json({
      error: error.message,
      details: error.details
    });
  }

  if (error instanceof ZodError) {
    return response.status(400).json({
      error: "Validation error",
      details: error.flatten()
    });
  }

  console.error("[error]", error);

  return response.status(500).json({
    error: "Internal server error"
  });
};
