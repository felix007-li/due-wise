package ca.duewise;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/account")
class DataController {
  final BillRepository bills;
  final PaymentRepository payments;
  final OccurrenceRepository occurrences;
  final UserRepository users;
  final PasswordEncoder passwords;
  final JdbcTemplate jdbc;

  DataController(
      BillRepository b,
      PaymentRepository p,
      OccurrenceRepository o,
      UserRepository u,
      PasswordEncoder e,
      JdbcTemplate j) {
    bills = b;
    payments = p;
    occurrences = o;
    users = u;
    passwords = e;
    jdbc = j;
  }

  @GetMapping("/export")
  @Transactional(readOnly = true)
  ResponseEntity<?> export(
      Principal principal, @RequestParam(defaultValue = "json") String format) {
    UUID owner = BillController.owner(principal);
    var records = bills.findByUserId(owner);
    var headers = new HttpHeaders();
    headers.setCacheControl("no-store");
    headers.set(
        "Content-Disposition",
        "attachment; filename=\"duewise-export." + (format.equals("csv") ? "csv" : "json") + "\"");
    if (format.equals("json")) {
      headers.setContentType(MediaType.APPLICATION_JSON);
      return ResponseEntity.ok()
          .headers(headers)
          .body(
              Map.of(
                  "exportVersion",
                  "1.0",
                  "exportedAt",
                  java.time.Instant.now(),
                  "settings",
                  AuthController.view(users.findById(owner).orElseThrow(ApiException::notFound)),
                  "bills",
                  records,
                  "occurrences",
                  occurrences.findAllByUserId(owner),
                  "payments",
                  payments.findByUserId(owner),
                  "notice",
                  "User-entered planning facts and recorded payment marks; not bank-confirmed"
                      + " transactions."));
    }
    if (!format.equals("csv")) throw new ApiException(400, "FORMAT", "Choose json or csv.");
    headers.setContentType(new MediaType("text", "csv", StandardCharsets.UTF_8));
    StringBuilder csv =
        new StringBuilder(
            "id,name,amount,currency,first_due,recurrence,category,active,subscription,notes\r\n");
    for (Bill b : records)
      csv.append(
              List.of(
                      b.id.toString(),
                      b.name,
                      b.amount.toPlainString(),
                      b.currency,
                      b.firstDue.toString(),
                      b.recurrence,
                      b.category,
                      String.valueOf(b.active),
                      String.valueOf(b.subscription),
                      b.notes)
                  .stream()
                  .map(DataController::cell)
                  .collect(Collectors.joining(",")))
          .append("\r\n");
    return ResponseEntity.ok().headers(headers).body(csv.toString());
  }

  static String cell(String value) {
    String trimmed = value.stripLeading();
    if (!trimmed.isEmpty() && "=+-@\t\r\n".indexOf(trimmed.charAt(0)) >= 0
        || value.startsWith("\t")
        || value.startsWith("\r")
        || value.startsWith("\n")) value = "'" + value;
    return "\"" + value.replace("\"", "\"\"") + "\"";
  }

  record DeleteInput(@NotBlank String password, @NotBlank String confirmation) {}

  @DeleteMapping
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Transactional
  void delete(
      Principal principal, @Valid @RequestBody DeleteInput input, HttpServletRequest request) {
    UUID owner = BillController.owner(principal);
    AppUser user = users.findById(owner).orElseThrow(ApiException::notFound);
    if (!input.confirmation.equals("DELETE")
        || !passwords.matches(input.password, user.passwordHash))
      throw new ApiException(
          422, "CONFIRMATION", "Enter your password and type DELETE to delete your account.");
    for (String table :
        List.of(
            "notification_delivery",
            "reminder_preference",
            "projection_snapshot",
            "payment",
            "occurrence",
            "bill")) jdbc.update("DELETE FROM " + table + " WHERE user_id=?", owner);
    users.delete(user);
    users.flush();
    request.getSession().invalidate();
    SecurityContextHolder.clearContext();
  }
}
