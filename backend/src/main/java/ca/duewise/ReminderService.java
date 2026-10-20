package ca.duewise;

import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class ReminderService {
  final ProjectionService projections;
  final JdbcTemplate jdbc;

  ReminderService(ProjectionService p, JdbcTemplate j) {
    projections = p;
    jdbc = j;
  }

  @Transactional
  Map<String, Object> refresh(UUID owner) {
    projections.lockUser(owner);
    LocalDate today = projections.today(owner);
    var rows = projections.project(owner, today, today.plusDays(365));
    Set<UUID> paid = new HashSet<>();
    projections.payments().findByUserId(owner).forEach(p -> paid.add(p.occurrenceId));
    Map<UUID, Bill> bills = new HashMap<>();
    projections
        .bills()
        .findByUserIdAndActiveTrueOrderByFirstDueAscIdAsc(owner)
        .forEach(b -> bills.put(b.id, b));
    var prefs =
        jdbc.queryForList(
            "SELECT enabled FROM reminder_preference WHERE user_id=?", Boolean.class, owner);
    boolean enabled = prefs.isEmpty() || prefs.getFirst();
    List<Occurrence> due = new ArrayList<>();
    if (enabled)
      for (Occurrence o : rows) {
        Bill b = bills.get(o.billId);
        if (b == null || paid.contains(o.id)) continue;
        boolean isReminder =
            Arrays.stream(b.reminderDays.split(","))
                .filter(s -> !s.isBlank())
                .mapToInt(Integer::parseInt)
                .anyMatch(days -> o.dueDate.minusDays(days).equals(today));
        if (!isReminder) continue;
        due.add(o);
        Integer count =
            jdbc.queryForObject(
                "SELECT COUNT(*) FROM notification_delivery WHERE occurrence_id=? AND"
                    + " delivery_date=?",
                Integer.class,
                o.id,
                today);
        if (count != null && count == 0) {
          var now = OffsetDateTime.now(ZoneOffset.UTC);
          jdbc.update(
              "INSERT INTO"
                  + " notification_delivery(id,user_id,occurrence_id,delivery_date,created_at,updated_at,row_version)"
                  + " VALUES(?,?,?,?,?,?,0)",
              UUID.randomUUID(),
              owner,
              o.id,
              today,
              now,
              now);
        }
      }
    var out = projections.envelope(owner);
    out.put("enabled", enabled);
    out.put("items", projections.items(owner, due));
    out.put("channel", "in-app");
    out.put("timezone", projections.users().findById(owner).orElseThrow().timezone);
    return out;
  }

  @Transactional
  void preference(UUID owner, boolean enabled) {
    projections.lockUser(owner);
    var now = OffsetDateTime.now(ZoneOffset.UTC);
    int changed =
        jdbc.update(
            "UPDATE reminder_preference SET enabled=?,updated_at=?,row_version=row_version+1 WHERE"
                + " user_id=?",
            enabled,
            now,
            owner);
    if (changed == 0)
      jdbc.update(
          "INSERT INTO reminder_preference(id,user_id,enabled,created_at,updated_at,row_version)"
              + " VALUES(?,?,?,?,?,0)",
          UUID.randomUUID(),
          owner,
          enabled,
          now,
          now);
  }
}
