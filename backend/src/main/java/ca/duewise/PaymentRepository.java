package ca.duewise;

import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

interface PaymentRepository extends JpaRepository<Payment, UUID> {
  Optional<Payment> findByOccurrenceIdAndUserId(UUID occurrenceId, UUID owner);

  List<Payment> findByUserId(UUID owner);
}
