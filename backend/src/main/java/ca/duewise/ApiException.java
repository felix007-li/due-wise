package ca.duewise;

class ApiException extends RuntimeException {
  final int status;
  final String code;

  ApiException(int status, String code, String message) {
    super(message);
    this.status = status;
    this.code = code;
  }

  static ApiException notFound() {
    return new ApiException(404, "NOT_FOUND", "This item could not be found.");
  }
}
