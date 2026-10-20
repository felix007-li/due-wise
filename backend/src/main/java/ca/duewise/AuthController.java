package ca.duewise;

import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
class AuthController {
  record Credentials(
      @NotBlank @Email @Size(max = 254) String email,
      @NotBlank @Size(min = 12, max = 72) String password) {}

  private final UserRepository users;
  private final PasswordEncoder passwords;
  private final String dummy;
  private final Map<String, Attempt> attempts = new ConcurrentHashMap<>();

  record Attempt(long start, int count) {}

  AuthController(UserRepository users, PasswordEncoder passwords) {
    this.users = users;
    this.passwords = passwords;
    dummy = passwords.encode(UUID.randomUUID().toString());
  }

  @GetMapping("/csrf")
  Map<String, String> csrf(CsrfToken token) {
    return Map.of("token", token.getToken(), "headerName", token.getHeaderName());
  }

  private synchronized void limit(String address) {
    long now = System.currentTimeMillis();
    attempts.entrySet().removeIf(e -> now - e.getValue().start > 900_000);
    Attempt a = attempts.getOrDefault(address, new Attempt(now, 0));
    if (a.count >= 15 || attempts.size() > 10000)
      throw new ApiException(429, "RATE_LIMIT", "Too many attempts. Try again in 15 minutes.");
    attempts.put(address, new Attempt(a.start, a.count + 1));
  }

  @PostMapping("/register")
  @ResponseStatus(HttpStatus.CREATED)
  Map<String, Object> register(@Valid @RequestBody Credentials input, HttpServletRequest req) {
    limit(req.getRemoteAddr());
    checkPassword(input.password);
    String email = input.email.strip().toLowerCase(Locale.ROOT);
    if (users.findByEmail(email).isPresent())
      throw new ApiException(
          409,
          "REGISTRATION_UNAVAILABLE",
          "Unable to register with these details. Try signing in.");
    AppUser u = new AppUser();
    u.email = email;
    u.passwordHash = passwords.encode(input.password);
    users.saveAndFlush(u);
    return establish(u, req);
  }

  @PostMapping("/login")
  Map<String, Object> login(@Valid @RequestBody Credentials input, HttpServletRequest req) {
    limit(req.getRemoteAddr());
    checkPassword(input.password);
    AppUser u = users.findByEmail(input.email.strip().toLowerCase(Locale.ROOT)).orElse(null);
    boolean valid = passwords.matches(input.password, u == null ? dummy : u.passwordHash);
    if (!valid || u == null)
      throw new ApiException(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
    return establish(u, req);
  }

  private void checkPassword(String password) {
    if (password.getBytes(StandardCharsets.UTF_8).length > 72)
      throw new ApiException(422, "PASSWORD_LENGTH", "Password must use at most 72 UTF-8 bytes.");
  }

  private Map<String, Object> establish(AppUser u, HttpServletRequest req) {
    req.getSession(true);
    req.changeSessionId();
    var context = SecurityContextHolder.createEmptyContext();
    context.setAuthentication(
        new UsernamePasswordAuthenticationToken(u.id.toString(), null, List.of()));
    SecurityContextHolder.setContext(context);
    req.getSession()
        .setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);
    return view(u);
  }

  static Map<String, Object> view(AppUser u) {
    return Map.of(
        "id",
        u.id,
        "email",
        u.email,
        "timezone",
        u.timezone,
        "locale",
        u.locale,
        "currency",
        u.currency,
        "rowVersion",
        u.rowVersion);
  }

  @GetMapping("/me")
  Map<String, Object> me(java.security.Principal principal) {
    return view(
        users.findById(UUID.fromString(principal.getName())).orElseThrow(ApiException::notFound));
  }
}
