package ca.duewise;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "payment")
class Payment extends OwnedEntity {
  @Column(name = "occurrence_id", unique = true)
  public UUID occurrenceId;
}
