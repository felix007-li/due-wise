package ca.duewise;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.security.Principal;
import java.time.ZoneId;
import java.util.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/settings")
class SettingsController {
  record Input(
      @NotBlank @Size(max = 64) String timezone,
      @NotBlank @Pattern(regexp = "en-CA|fr-CA|zh-CN") String locale,
      @NotBlank @Pattern(regexp = "[A-Z]{3}") String currency,
      @PositiveOrZero long rowVersion) {}

  final UserRepository users;

  SettingsController(UserRepository u) {
    users = u;
  }

  @GetMapping
  Map<String, Object> get(Principal p) {
    return AuthController.view(
        users.findById(BillController.owner(p)).orElseThrow(ApiException::notFound));
  }

  @PutMapping
  @Transactional
  Map<String, Object> put(Principal p, @Valid @RequestBody Input i) {
    try {
      ZoneId.of(i.timezone());
      Currency.getInstance(i.currency());
    } catch (Exception e) {
      throw new ApiException(422, "SETTINGS", "Choose a valid timezone and currency.");
    }
    AppUser u = users.findById(BillController.owner(p)).orElseThrow(ApiException::notFound);
    if (u.rowVersion != i.rowVersion())
      throw new ApiException(409, "CONFLICT", "Settings changed. Refresh and try again.");
    u.timezone = i.timezone();
    u.locale = i.locale();
    u.currency = i.currency();
    u.updatedAt = java.time.Instant.now();
    users.saveAndFlush(u);
    return AuthController.view(u);
  }
}
