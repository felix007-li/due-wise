package ca.duewise;

import java.security.Principal;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/v1")
class ProjectionController {
  final ProjectionService service;
  final JdbcTemplate jdbc;
  final ObjectMapper json;

  ProjectionController(ProjectionService s, JdbcTemplate j, ObjectMapper m) {
    service = s;
    jdbc = j;
    json = m;
  }

  private void page(int page, int size) {
    if (page < 0 || size < 1 || size > 100)
      throw new ApiException(400, "PAGINATION", "Choose page >= 0 and size 1–100.");
  }

  @GetMapping("/calendar")
  @Transactional
  Map<String, Object> calendar(
      Principal p,
      @RequestParam LocalDate from,
      @RequestParam LocalDate to,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "50") int size) {
    page(page, size);
    UUID owner = BillController.owner(p);
    var items = service.items(owner, service.project(owner, from, to));
    var out = service.envelope(owner);
    long offset = (long) page * size;
    out.put("items", items.stream().skip(offset).limit(size).toList());
    out.put("total", items.size());
    out.put("page", page);
    out.put("size", size);
    return out;
  }

  @GetMapping("/dashboard")
  @Transactional
  Map<String, Object> dashboard(Principal p) {
    UUID owner = BillController.owner(p);
    LocalDate now = service.today(owner);
    var items = service.items(owner, service.project(owner, now.minusDays(336), now.plusDays(29)));
    var unpaid = items.stream().filter(i -> !i.paid()).toList();
    var next30 = unpaid.stream().filter(i -> !i.dueDate().isBefore(now)).toList();
    var next7 = next30.stream().filter(i -> i.dueDate().isBefore(now.plusDays(7))).toList();
    var overdue = unpaid.stream().filter(ProjectionService.Item::overdue).toList();
    var out = service.envelope(owner);
    out.put("next7Totals", service.totals(next7));
    out.put("roundedCurrencyAmounts", service.totals(next30));
    out.put("dueThisWeek", next7.size());
    out.put(
        "dueNextWeek",
        next30.stream()
            .filter(
                i ->
                    !i.dueDate().isBefore(now.plusDays(7))
                        && i.dueDate().isBefore(now.plusDays(14)))
            .count());
    out.put("overdueCount", overdue.size());
    out.put("upcoming", unpaid.stream().limit(8).toList());
    out.put("overdueLookbackDays", 336);
    snapshot(owner, out);
    return out;
  }

  @GetMapping("/insights")
  @Transactional
  Map<String, Object> insights(Principal p, @RequestParam(required = false) YearMonth month) {
    UUID owner = BillController.owner(p);
    if (month == null) month = YearMonth.from(service.today(owner));
    var items = service.items(owner, service.project(owner, month.atDay(1), month.atEndOfMonth()));
    Map<String, List<ProjectionService.Item>> grouped = new TreeMap<>();
    items.forEach(i -> grouped.computeIfAbsent(i.category(), k -> new ArrayList<>()).add(i));
    Map<String, Map<String, String>> categories = new TreeMap<>();
    grouped.forEach((c, list) -> categories.put(c, service.totals(list)));
    var out = service.envelope(owner);
    out.put("month", month.toString());
    out.put("roundedCurrencyAmounts", service.totals(items));
    out.put(
        "subscriptionTotals",
        service.totals(items.stream().filter(ProjectionService.Item::subscription).toList()));
    out.put("unpaidTotals", service.totals(items.stream().filter(i -> !i.paid()).toList()));
    out.put("categoryTotals", categories);
    out.put("occurrenceCount", items.size());
    out.put(
        "comparison",
        Map.of(
            "available",
            false,
            "reason",
            "Historical comparisons require complete, immutable historical coverage; projections"
                + " are not verified past spending."));
    snapshot(owner, out);
    return out;
  }

  private void snapshot(UUID owner, Map<String, Object> payload) {
    try {
      jdbc.update(
          "INSERT INTO"
              + " projection_snapshot(id,user_id,as_of_date,calculation_version,assumptions,payload,created_at,updated_at,row_version)"
              + " VALUES (?,?,?,?,?,?,?,?,0)",
          UUID.randomUUID(),
          owner,
          payload.get("asOfDate"),
          payload.get("calculationVersion"),
          json.writeValueAsString(payload.get("assumptions")),
          json.writeValueAsString(payload),
          OffsetDateTime.now(ZoneOffset.UTC),
          OffsetDateTime.now(ZoneOffset.UTC));
    } catch (JacksonException e) {
      throw new IllegalStateException("Projection serialization failed", e);
    }
  }

  @PostMapping("/occurrences/{id}/pay")
  @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
  void pay(Principal p, @PathVariable UUID id) {
    service.pay(BillController.owner(p), id, false);
  }

  @PostMapping("/occurrences/{id}/undo")
  @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
  void undo(Principal p, @PathVariable UUID id) {
    service.pay(BillController.owner(p), id, true);
  }
}
