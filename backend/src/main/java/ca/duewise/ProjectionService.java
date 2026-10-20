package ca.duewise;

import ca.duewise.domain.Schedule;
import jakarta.persistence.EntityManager;
import java.math.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class ProjectionService {
  final BillRepository bills;
  final OccurrenceRepository occurrences;
  final PaymentRepository payments;
  final UserRepository users;
  final EntityManager em;
  final Clock clock;

  ProjectionService(
      BillRepository b,
      OccurrenceRepository o,
      PaymentRepository p,
      UserRepository u,
      EntityManager em,
      Clock clock) {
    bills = b;
    occurrences = o;
    payments = p;
    users = u;
    this.em = em;
    this.clock = clock;
  }

  BillRepository bills() {
    return bills;
  }

  PaymentRepository payments() {
    return payments;
  }

  UserRepository users() {
    return users;
  }

  LocalDate today(UUID owner) {
    return ca.duewise.domain.BusinessDates.today(
        clock, users.findById(owner).orElseThrow(ApiException::notFound).timezone);
  }

  void lockUser(UUID owner) {
    em.find(AppUser.class, owner, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
  }

  void clearUnpaid(Bill bill) {
    lockUser(bill.userId);
    Set<UUID> paid = new HashSet<>();
    payments.findByUserId(bill.userId).forEach(p -> paid.add(p.occurrenceId));
    occurrences.deleteAll(
        occurrences.findByBillIdAndUserId(bill.id, bill.userId).stream()
            .filter(o -> !paid.contains(o.id))
            .toList());
    occurrences.flush();
  }

  @Transactional
  List<Occurrence> project(UUID owner, LocalDate from, LocalDate to) {
    if (from == null
        || to == null
        || from.isBefore(LocalDate.of(2000, 1, 1))
        || to.isAfter(LocalDate.of(2101, 12, 31)))
      throw new ApiException(422, "DATE_RANGE", "Dates must be between 2000 and 2101.");
    if (to.isBefore(from) || java.time.temporal.ChronoUnit.DAYS.between(from, to) > 366)
      throw new ApiException(422, "DATE_RANGE", "Choose a date range of at most 367 dates.");
    lockUser(owner);
    List<Occurrence> existing =
        occurrences.findByUserIdAndDueDateBetweenOrderByDueDateAscIdAsc(owner, from, to);
    Set<String> keys = new HashSet<>();
    existing.forEach(o -> keys.add(o.billId + ":" + o.dueDate));
    for (Bill b : bills.findByUserIdAndActiveTrueOrderByFirstDueAscIdAsc(owner)) {
      for (LocalDate date :
          Schedule.dates(b.firstDue, b.recurrence, b.everyNWeeks, b.monthEndPolicy, from, to)) {
        if (keys.add(b.id + ":" + date)) {
          Occurrence o = new Occurrence();
          o.userId = owner;
          o.billId = b.id;
          o.dueDate = date;
          o.name = b.name;
          o.category = b.category;
          o.subscription = b.subscription;
          o.amount = b.amount;
          o.currency = b.currency;
          occurrences.save(o);
        }
      }
    }
    occurrences.flush();
    return occurrences.findByUserIdAndDueDateBetweenOrderByDueDateAscIdAsc(owner, from, to);
  }

  record Item(
      UUID id,
      UUID billId,
      LocalDate dueDate,
      String name,
      String category,
      boolean subscription,
      String amount,
      String currency,
      boolean paid,
      boolean overdue) {}

  List<Item> items(UUID owner, List<Occurrence> rows) {
    Set<UUID> paid = new HashSet<>();
    payments.findByUserId(owner).forEach(p -> paid.add(p.occurrenceId));
    LocalDate now = today(owner);
    return rows.stream()
        .map(
            o ->
                new Item(
                    o.id,
                    o.billId,
                    o.dueDate,
                    o.name,
                    o.category,
                    o.subscription,
                    rounded(o.amount, o.currency),
                    o.currency,
                    paid.contains(o.id),
                    o.dueDate.isBefore(now) && !paid.contains(o.id)))
        .toList();
  }

  static String rounded(BigDecimal amount, String currency) {
    return amount
        .setScale(
            Math.max(0, Currency.getInstance(currency).getDefaultFractionDigits()),
            RoundingMode.HALF_EVEN)
        .toPlainString();
  }

  Map<String, String> totals(List<Item> items) {
    Map<String, BigDecimal> total = new TreeMap<>();
    items.forEach(i -> total.merge(i.currency, new BigDecimal(i.amount), BigDecimal::add));
    Map<String, String> result = new TreeMap<>();
    total.forEach((c, a) -> result.put(c, rounded(a, c)));
    return result;
  }

  Map<String, Object> envelope(UUID owner) {
    return new LinkedHashMap<>(
        Map.of(
            "asOfDate",
            today(owner),
            "calculationVersion",
            Schedule.VERSION,
            "assumptions",
            List.of(
                "Dates use your selected local timezone; dates are never UTC-converted.",
                "Occurrences derive from the original anchor and selected month-end policy.",
                "Each occurrence is rounded HALF_EVEN to ISO currency minor units before totals.",
                "Currencies are kept separate; no exchange-rate conversion.",
                "Paid status means manually recorded, not bank-confirmed."),
            "warnings",
            List.of("Personal planning estimates only; not individualized financial advice.")));
  }

  @Transactional
  void pay(UUID owner, UUID id, boolean undo) {
    lockUser(owner);
    Occurrence o = occurrences.lockOwned(id, owner).orElseThrow(ApiException::notFound);
    var p = payments.findByOccurrenceIdAndUserId(o.id, owner);
    if (undo) {
      p.ifPresent(payments::delete);
    } else if (p.isEmpty()) {
      Payment payment = new Payment();
      payment.userId = owner;
      payment.occurrenceId = id;
      payments.saveAndFlush(payment);
    }
  }
}
