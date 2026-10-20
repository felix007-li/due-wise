package ca.duewise;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@MappedSuperclass
abstract class OwnedEntity {
  @Id public UUID id = UUID.randomUUID();

  @Column(name = "user_id", nullable = false)
  public UUID userId;

  @Column(name = "created_at", nullable = false)
  public Instant createdAt = Instant.now();

  @Column(name = "updated_at", nullable = false)
  public Instant updatedAt = Instant.now();

  @Version
  @Column(name = "row_version")
  public long rowVersion;

  @PreUpdate
  void touch() {
    updatedAt = Instant.now();
  }
}
