package ca.duewise;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "bill")
class Bill extends OwnedEntity {
  @Transient public LocalDate nextDue;

  @Column(nullable = false, length = 120)
  public String name;

  @Column(nullable = false, precision = 19, scale = 4)
  public BigDecimal amount;

  @Column(nullable = false, length = 3)
  public String currency;

  @Column(name = "first_due", nullable = false)
  public LocalDate firstDue;

  public String recurrence;

  @Column(name = "every_n_weeks")
  public int everyNWeeks;

  @Column(name = "month_end_policy")
  public String monthEndPolicy;

  public String category;
  public boolean subscription;
  public boolean active;

  @Column(name = "reminder_days")
  public String reminderDays;

  @Column(length = 2000)
  public String notes;
}
