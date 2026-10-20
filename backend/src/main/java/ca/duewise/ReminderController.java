package ca.duewise;

import java.security.Principal;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/reminders")
class ReminderController {
  record Preference(boolean enabled) {}

  final ReminderService reminders;

  ReminderController(ReminderService r) {
    reminders = r;
  }

  @GetMapping
  Map<String, Object> get(Principal p) {
    return reminders.refresh(BillController.owner(p));
  }

  @PutMapping("/preference")
  @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
  void put(Principal p, @RequestBody Preference i) {
    reminders.preference(BillController.owner(p), i.enabled());
  }
}
