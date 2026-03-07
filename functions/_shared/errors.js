class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

function toAppError(err, fallbackMessage = "Server error") {
  if (err instanceof AppError) return err;
  return new AppError(err && err.message ? err.message : fallbackMessage, 500, err);
}

module.exports = {
  AppError,
  toAppError,
};
