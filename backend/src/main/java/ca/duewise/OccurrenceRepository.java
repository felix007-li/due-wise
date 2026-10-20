package ca.duewise;

import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

interface OccurrenceRepository extends JpaRepository<Occurrence, UUID> {
  List<Occurrence> findAllByUserId(UUID owner);

  List<Occurrence> findByUserIdAndDueDateBetweenOrderByDueDateAscIdAsc(
      UUID owner, LocalDate from, LocalDate to);

  List<Occurrence> findByBillIdAndUserId(UUID billId, UUID owner);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select o from Occurrence o where o.id=:id and o.userId=:owner")
  Optional<Occurrence> lockOwned(@Param("id") UUID id, @Param("owner") UUID owner);
}
