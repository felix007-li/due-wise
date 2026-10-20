package ca.duewise;

import static org.junit.jupiter.api.Assertions.*;

import ca.duewise.domain.BusinessDates;
import java.time.*;
import org.junit.jupiter.api.Test;

class BusinessDatesTest {
  @Test
  void reminderDayIsLocalAtUtcMidnightAndDstBoundary() {
    var before = Clock.fixed(Instant.parse("2025-03-09T04:30:00Z"), ZoneOffset.UTC);
    assertEquals(LocalDate.parse("2025-03-08"), BusinessDates.today(before, "America/Toronto"));
    assertEquals(LocalDate.parse("2025-03-09"), BusinessDates.today(before, "Pacific/Auckland"));
    var after = Clock.fixed(Instant.parse("2025-03-09T07:30:00Z"), ZoneOffset.UTC);
    assertEquals(LocalDate.parse("2025-03-09"), BusinessDates.today(after, "America/Toronto"));
    assertEquals(LocalDate.parse("2025-03-08"), BusinessDates.today(after, "America/Vancouver"));
  }
}
