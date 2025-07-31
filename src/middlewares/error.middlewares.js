import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js"; // or your custom ApiError if that's what you're using

const errorHandler = (E, request, response, next) => {
  let error = E;

  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || (error instanceof mongoose.Error ? 400 : 500);

    const message = error.message || "Something went wrong";

    error = new ApiError(statusCode, message, error?.errors || [], error.stack);
  }

  const errorResponse = {
    ...error,
    message: error.message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  };

  return response.status(error.statusCode).json(errorResponse);
};

export { errorHandler };
