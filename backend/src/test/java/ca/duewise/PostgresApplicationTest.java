package ca.duewise;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

/** Re-runs the complete bill/ownership/payment flow on actual PostgreSQL 16. */
@Testcontainers(disabledWithoutDocker = true)
class PostgresApplicationTest extends BillFlowTest {
  @Container static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16.11-alpine");

  @DynamicPropertySource
  static void postgres(DynamicPropertyRegistry r) {
    r.add("spring.datasource.url", postgres::getJdbcUrl);
    r.add("spring.datasource.username", postgres::getUsername);
    r.add("spring.datasource.password", postgres::getPassword);
  }
}
