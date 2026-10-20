package ca.duewise;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(
    name = "occurrence",
    uniqueConstraints = @UniqueConstraint(columnNames = {"bill_id", "due_date"}))
class Occurrence extends OwnedEntity {
  @Column(name = "bill_id")
  public UUID billId;

  @Column(name = "due_date")
  public LocalDate dueDate;

  public String name;
  public String category;
  public boolean subscription;

  @Column(precision = 19, scale = 4)
  public BigDecimal amount;

  @Column(length = 3)
  public String currency;
}
