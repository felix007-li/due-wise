package ca.duewise.domain;

import java.time.*;

public final class BusinessDates {
  private BusinessDates() {}

  public static LocalDate today(Clock clock, String timezone) {
    return LocalDate.now(clock.withZone(ZoneId.of(timezone)));
  }
}
