package ca.duewise;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class BillService {
  final BillRepository bills;
  final UserRepository users;

  final PaymentRepository payments;
  final OccurrenceRepository occurrences;
  final java.time.Clock clock;

  BillService(
      BillRepository bills,
      UserRepository users,
      PaymentRepository payments,
      OccurrenceRepository occurrences,
      java.time.Clock clock) {
    this.bills = bills;
    this.users = users;
    this.payments = payments;
    this.occurrences = occurrences;
    this.clock = clock;
  }

  Bill decorate(Bill bill) {
    return decorateAll(List.of(bill)).getFirst();
  }

  List<Bill> decorateAll(List<Bill> rows) {
    if (rows.isEmpty()) return rows;
    UUID owner = rows.getFirst().userId;
    LocalDate today =
        ca.duewise.domain.BusinessDates.today(
            clock, users.findById(owner).orElseThrow(ApiException::notFound).timezone);
    Set<UUID> paidIds = new HashSet<>();
    payments.findByUserId(owner).forEach(p -> paidIds.add(p.occurrenceId));
    Map<UUID, Set<LocalDate>> paidDates = new HashMap<>();
    occurrences.findAllByUserId(owner).stream()
        .filter(o -> paidIds.contains(o.id))
        .forEach(o -> paidDates.computeIfAbsent(o.billId, k -> new HashSet<>()).add(o.dueDate));
    for (Bill b : rows) {
      if (!b.active) {
        b.nextDue = null;
        continue;
      }
      LocalDate from = b.firstDue.isAfter(today) ? b.firstDue : today;
      b.nextDue =
          ca.duewise.domain.Schedule.dates(
                  b.firstDue,
                  b.recurrence,
                  b.everyNWeeks,
                  b.monthEndPolicy,
                  from,
                  from.plusDays(366))
              .stream()
              .filter(d -> !paidDates.getOrDefault(b.id, Set.of()).contains(d))
              .findFirst()
              .orElse(null);
    }
    return rows;
  }

  BillRepository bills() {
    return bills;
  }

  Bill owned(UUID id, UUID owner) {
    return bills.findByIdAndUserId(id, owner).orElseThrow(ApiException::notFound);
  }

  @Transactional
  Bill create(UUID owner, BillInput input) {
    if (bills.countByUserId(owner) >= 500)
      throw new ApiException(422, "BILL_LIMIT", "An account supports up to 500 bills.");
    Bill b = new Bill();
    b.userId = owner;
    apply(b, input);
    return decorate(bills.saveAndFlush(b));
  }

  void apply(Bill b, BillInput i) {
    try {
      if (java.util.Currency.getInstance(i.currency()).getDefaultFractionDigits() < 0)
        throw new IllegalArgumentException();
    } catch (IllegalArgumentException e) {
      throw new ApiException(422, "CURRENCY", "Choose an ISO 4217 currency.");
    }
    if (i.firstDue().isBefore(LocalDate.of(2000, 1, 1))
        || i.firstDue().isAfter(LocalDate.of(2100, 12, 31)))
      throw new ApiException(422, "DATE_RANGE", "Choose a due date between 2000 and 2100.");
    if (i.name().strip().isEmpty()) throw new ApiException(422, "NAME", "Enter a bill name.");
    b.name = i.name().strip();
    b.amount = i.amount();
    b.currency = i.currency();
    b.firstDue = i.firstDue();
    b.recurrence = i.recurrence();
    b.everyNWeeks = i.everyNWeeks();
    b.monthEndPolicy = i.monthEndPolicy();
    b.category = i.category().strip();
    b.subscription = i.subscription();
    b.active = i.active();
    b.reminderDays =
        i.reminderDays().stream()
            .distinct()
            .sorted()
            .map(String::valueOf)
            .collect(Collectors.joining(","));
    b.notes = i.notes().strip();
  }
}
