export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }

  static badRequest(message: string, code = "BAD_REQUEST") {
    return new AppError(400, code, message);
  }

  static unauthorized(message: string, code = "UNAUTHORIZED") {
    return new AppError(401, code, message);
  }

  static notFound(message: string, code = "NOT_FOUND") {
    return new AppError(404, code, message);
  }

  static internal(message = "Internal server error", code = "INTERNAL_ERROR") {
    return new AppError(500, code, message);
  }
}
