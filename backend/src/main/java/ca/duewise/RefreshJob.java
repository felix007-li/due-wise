package ca.duewise;

import java.time.*;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.*;

@Configuration
@EnableScheduling
class RefreshJob {
  final UserRepository users;
  final ReminderService reminders;
  final JdbcTemplate jdbc;

  RefreshJob(UserRepository u, ReminderService r, JdbcTemplate j) {
    users = u;
    reminders = r;
    jdbc = j;
  }

  /** In-app delivery only. Each account is evaluated in its own timezone. */
  @Scheduled(cron = "0 10 * * * *", zone = "UTC")
  void refresh() {
    int page = 0;
    org.springframework.data.domain.Page<AppUser> batch;
    do {
      batch = users.findAll(PageRequest.of(page++, 100));
      for (AppUser u : batch)
        try {
          reminders.refresh(u.id);
        } catch (RuntimeException e) {
          LoggerFactory.getLogger(getClass())
              .error("event=projection_refresh_failed type={}", e.getClass().getSimpleName());
        }
    } while (batch.hasNext());
    jdbc.update(
        "DELETE FROM projection_snapshot WHERE created_at < ?",
        OffsetDateTime.now(ZoneOffset.UTC).minusDays(30));
  }
}
