package ca.duewise;

import jakarta.servlet.http.HttpServletRequest;
import java.util.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
class ApiErrors {
  static Map<String, Object> body(
      String code, String message, Map<String, String> fields, HttpServletRequest req) {
    return Map.of(
        "code",
        code,
        "message",
        message,
        "fieldErrors",
        fields,
        "requestId",
        String.valueOf(req.getAttribute("requestId")));
  }

  @ExceptionHandler(ApiException.class)
  ResponseEntity<?> known(ApiException e, HttpServletRequest r) {
    return ResponseEntity.status(e.status).body(body(e.code, e.getMessage(), Map.of(), r));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<?> validation(MethodArgumentNotValidException e, HttpServletRequest r) {
    var fields = new TreeMap<String, String>();
    e.getBindingResult()
        .getFieldErrors()
        .forEach(f -> fields.put(f.getField(), f.getDefaultMessage()));
    return ResponseEntity.unprocessableEntity()
        .body(body("VALIDATION", "Please check the highlighted fields.", fields, r));
  }

  @ExceptionHandler({
    MethodArgumentTypeMismatchException.class,
    HttpMessageNotReadableException.class
  })
  ResponseEntity<?> malformed(Exception e, HttpServletRequest r) {
    return ResponseEntity.badRequest()
        .body(body("MALFORMED", "The request contains an invalid value.", Map.of(), r));
  }

  @ExceptionHandler({
    ObjectOptimisticLockingFailureException.class,
    DataIntegrityViolationException.class
  })
  ResponseEntity<?> conflict(Exception e, HttpServletRequest r) {
    return ResponseEntity.status(409)
        .body(body("CONFLICT", "The record changed. Refresh and try again.", Map.of(), r));
  }

  @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
  ResponseEntity<?> missing(Exception e, HttpServletRequest r) {
    return ResponseEntity.status(404)
        .body(body("NOT_FOUND", "This resource could not be found.", Map.of(), r));
  }

  @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
  ResponseEntity<?> method(Exception e, HttpServletRequest r) {
    return ResponseEntity.status(405)
        .body(body("METHOD_NOT_ALLOWED", "This method is not supported.", Map.of(), r));
  }

  @ExceptionHandler(Exception.class)
  ResponseEntity<?> unexpected(Exception e, HttpServletRequest r) {
    org.slf4j.LoggerFactory.getLogger(getClass())
        .error(
            "event=unexpected_error requestId={} type={}",
            r.getAttribute("requestId"),
            e.getClass().getSimpleName());
    return ResponseEntity.internalServerError()
        .body(
            body(
                "INTERNAL_ERROR",
                "We could not complete this request. Try again or contact support with the request"
                    + " ID.",
                Map.of(),
                r));
  }
}
