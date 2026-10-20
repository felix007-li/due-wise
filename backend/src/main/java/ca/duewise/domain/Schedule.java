package ca.duewise.domain;

import java.time.*;
import java.util.*;

/** All dates derive from the original anchor, never from a clamped previous date. */
public final class Schedule {
  public static final String VERSION = "schedule-1.0";

  private Schedule() {}

  public static List<LocalDate> dates(
      LocalDate anchor, String recurrence, int weeks, String policy, LocalDate from, LocalDate to) {
    Objects.requireNonNull(anchor);
    Objects.requireNonNull(from);
    Objects.requireNonNull(to);
    if (to.isBefore(from) || java.time.temporal.ChronoUnit.DAYS.between(from, to) > 366)
      throw new IllegalArgumentException("Choose a range of at most 367 dates.");
    if (!Set.of("clamp", "last_day_of_month").contains(policy) || weeks < 1 || weeks > 52)
      throw new IllegalArgumentException("Invalid schedule assumptions.");
    int months =
        switch (recurrence) {
          case "monthly" -> 1;
          case "quarterly" -> 3;
          case "yearly" -> 12;
          case "once", "weekly", "every_n_weeks" -> 0;
          default -> throw new IllegalArgumentException("Unsupported recurrence.");
        };
    List<LocalDate> result = new ArrayList<>();
    if (to.isBefore(anchor)) return result;
    long start = 0;
    if (from.isAfter(anchor)) {
      start =
          months > 0
              ? Math.max(
                  0,
                  java.time.temporal.ChronoUnit.MONTHS.between(
                              YearMonth.from(anchor), YearMonth.from(from))
                          / months
                      - 1)
              : recurrence.equals("once")
                  ? 0
                  : Math.max(
                      0,
                      java.time.temporal.ChronoUnit.DAYS.between(anchor, from)
                              / (7L * (recurrence.equals("weekly") ? 1 : weeks))
                          - 1);
    }
    for (long i = start; i < start + 1000; i++) {
      if (recurrence.equals("once") && i > 0) break;
      LocalDate due;
      if (months > 0) {
        YearMonth m = YearMonth.from(anchor).plusMonths(i * months);
        due =
            m.atDay(
                policy.equals("last_day_of_month")
                    ? m.lengthOfMonth()
                    : Math.min(anchor.getDayOfMonth(), m.lengthOfMonth()));
      } else due = anchor.plusWeeks(i * (recurrence.equals("weekly") ? 1 : weeks));
      if (due.isAfter(to)) break;
      if (!due.isBefore(from) && !due.isBefore(anchor)) result.add(due);
    }
    return List.copyOf(result);
  }
}
