package ca.duewise;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "app_user")
class AppUser {
  @Id public UUID id = UUID.randomUUID();

  @Column(nullable = false, unique = true)
  public String email;

  @Column(name = "password_hash", nullable = false, length = 100)
  public String passwordHash;

  public String timezone = "America/Toronto";
  public String locale = "en-CA";
  public String currency = "CAD";

  @Column(name = "created_at")
  public Instant createdAt = Instant.now();

  @Column(name = "updated_at")
  public Instant updatedAt = Instant.now();

  @Version
  @Column(name = "row_version")
  public long rowVersion;
}
