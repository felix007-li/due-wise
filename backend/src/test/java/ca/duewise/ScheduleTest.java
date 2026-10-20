package ca.duewise;

import static org.junit.jupiter.api.Assertions.*;

import ca.duewise.domain.Schedule;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.Test;

class ScheduleTest {
  List<LocalDate> dates(String anchor, String recurrence, String policy, String from, String to) {
    return Schedule.dates(
        LocalDate.parse(anchor), recurrence, 2, policy, LocalDate.parse(from), LocalDate.parse(to));
  }

  @Test
  void january31RestoresOriginalAnchorAfterFebruary() {
    assertEquals(
        List.of(
            LocalDate.parse("2025-01-31"),
            LocalDate.parse("2025-02-28"),
            LocalDate.parse("2025-03-31")),
        dates("2025-01-31", "monthly", "clamp", "2025-01-01", "2025-03-31"));
  }

  @Test
  void leapFebruary() {
    assertEquals(
        List.of(LocalDate.parse("2024-02-29")),
        dates("2024-01-31", "monthly", "clamp", "2024-02-01", "2024-02-29"));
  }

  @Test
  void leapYearYearlyRestoresLeapDay() {
    assertEquals(
        List.of(LocalDate.parse("2028-02-29")),
        dates("2024-02-29", "yearly", "clamp", "2028-01-01", "2028-12-31"));
  }

  @Test
  void explicitMonthEnd() {
    assertEquals(
        List.of(LocalDate.parse("2025-04-30"), LocalDate.parse("2025-05-31")),
        dates("2025-04-15", "monthly", "last_day_of_month", "2025-04-01", "2025-05-31"));
  }

  @Test
  void weeklyAcrossDstIsSevenLocalDates() {
    assertEquals(
        List.of(
            LocalDate.parse("2025-03-02"),
            LocalDate.parse("2025-03-09"),
            LocalDate.parse("2025-03-16")),
        dates("2025-03-02", "weekly", "clamp", "2025-03-01", "2025-03-16"));
  }

  @Test
  void fortnightlyAndQuarterly() {
    assertEquals(
        List.of(
            LocalDate.parse("2025-01-01"),
            LocalDate.parse("2025-01-15"),
            LocalDate.parse("2025-01-29")),
        dates("2025-01-01", "every_n_weeks", "clamp", "2025-01-01", "2025-01-31"));
    assertEquals(
        List.of(LocalDate.parse("2025-04-30")),
        dates("2025-01-31", "quarterly", "clamp", "2025-04-01", "2025-04-30"));
  }

  @Test
  void onceAndInvalidRanges() {
    assertEquals(1, dates("2025-01-01", "once", "clamp", "2025-01-01", "2025-12-31").size());
    assertThrows(
        IllegalArgumentException.class,
        () -> dates("2025-01-01", "monthly", "clamp", "2025-01-01", "2027-01-01"));
  }

  @Test
  void postingBoundaryUsesHalfEvenAndCurrencyMinorUnits() {
    assertEquals("1.00", ProjectionService.rounded(new java.math.BigDecimal("1.005"), "CAD"));
    assertEquals("1.02", ProjectionService.rounded(new java.math.BigDecimal("1.015"), "CAD"));
    assertEquals("2", ProjectionService.rounded(new java.math.BigDecimal("1.5"), "JPY"));
  }

  @Test
  void monthlyInvariantsAcross400Years() {
    for (int year = 2000; year < 2400; year++)
      for (int day = 28; day <= 31; day++) {
        LocalDate anchor = LocalDate.of(year, 1, day);
        var dates =
            Schedule.dates(anchor, "monthly", 1, "clamp", anchor, anchor.plusYears(1).minusDays(1));
        assertEquals(12, dates.size());
        assertEquals(12, new HashSet<>(dates).size());
        for (LocalDate d : dates) assertEquals(Math.min(day, d.lengthOfMonth()), d.getDayOfMonth());
      }
  }
}
