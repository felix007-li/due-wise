package ca.duewise;

import java.util.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;

interface BillRepository extends JpaRepository<Bill, UUID> {
  Optional<Bill> findByIdAndUserId(UUID id, UUID userId);

  Page<Bill> findByUserIdOrderByFirstDueAscIdAsc(UUID userId, Pageable page);

  List<Bill> findByUserIdAndActiveTrueOrderByFirstDueAscIdAsc(UUID userId);

  long countByUserId(UUID userId);

  List<Bill> findByUserId(UUID userId);
}
