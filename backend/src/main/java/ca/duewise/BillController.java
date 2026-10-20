package ca.duewise;

import jakarta.validation.Valid;
import java.security.Principal;
import java.util.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/bills")
class BillController {
  private final BillService service;
  private final ProjectionService projections;

  BillController(BillService s, ProjectionService p) {
    service = s;
    projections = p;
  }

  static UUID owner(Principal p) {
    return UUID.fromString(p.getName());
  }

  @GetMapping
  @Transactional(readOnly = true)
  Map<String, Object> list(
      Principal p,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "50") int size) {
    if (page < 0 || size < 1 || size > 100)
      throw new ApiException(
          400, "PAGINATION", "Page must be positive and size between 1 and 100.");
    var result =
        service.bills().findByUserIdOrderByFirstDueAscIdAsc(owner(p), PageRequest.of(page, size));
    var all = service.bills().findByUserId(owner(p));
    var duplicates =
        all.stream()
            .filter(
                b ->
                    all.stream()
                        .anyMatch(
                            o ->
                                !o.id.equals(b.id)
                                    && o.name.equalsIgnoreCase(b.name)
                                    && o.amount.compareTo(b.amount) == 0
                                    && o.currency.equals(b.currency)
                                    && o.recurrence.equals(b.recurrence)))
            .map(b -> b.id)
            .toList();
    return Map.of(
        "items",
        service.decorateAll(result.getContent()),
        "total",
        result.getTotalElements(),
        "page",
        page,
        "size",
        size,
        "duplicateIds",
        duplicates);
  }

  @GetMapping("/{id}")
  Bill get(Principal p, @PathVariable UUID id) {
    return service.decorate(service.owned(id, owner(p)));
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  Bill create(Principal p, @Valid @RequestBody BillInput input) {
    return service.create(owner(p), input);
  }

  @PatchMapping("/{id}")
  @Transactional
  Bill edit(Principal p, @PathVariable UUID id, @Valid @RequestBody BillInput input) {
    Bill b = service.owned(id, owner(p));
    if (b.rowVersion != input.rowVersion())
      throw new ApiException(409, "CONFLICT", "This bill changed. Refresh before saving.");
    projections.clearUnpaid(b);
    service.apply(b, input);
    return service.decorate(service.bills().saveAndFlush(b));
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Transactional
  void disable(Principal p, @PathVariable UUID id) {
    Bill b = service.owned(id, owner(p));
    projections.clearUnpaid(b);
    b.active = false;
    service.bills().saveAndFlush(b);
  }
}
