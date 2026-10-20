package ca.duewise;

import java.math.BigDecimal;
import java.security.Principal;
import java.util.*;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/** Explicit local-only fixtures; never seeds production accounts or publishes market prices. */
@Profile("local")
@RestController
@RequestMapping("/api/v1/account/demo")
class DemoController {
  final BillService bills;
  final ProjectionService projections;

  DemoController(BillService b, ProjectionService p) {
    bills = b;
    projections = p;
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @Transactional
  Map<String, String> seed(Principal p) {
    UUID owner = BillController.owner(p);
    projections.lockUser(owner);
    if (bills.bills().countByUserId(owner) > 0)
      throw new ApiException(
          409, "DEMO_NOT_EMPTY", "Demo fixtures can only be added to an empty local account.");
    String[][] fixtures = {
      {"Demo · Rent", "1000", "Housing"},
      {"Demo · Hydro", "124", "Utilities"},
      {"Demo · Internet", "65", "Internet"},
      {"Demo · Music", "11", "Entertainment"}
    };
    int day = 0;
    for (var f : fixtures)
      bills.create(
          owner,
          new BillInput(
              f[0],
              new BigDecimal(f[1]),
              "CAD",
              projections.today(owner).plusDays(++day * 3),
              "monthly",
              1,
              "clamp",
              f[2],
              day == 4,
              true,
              List.of(3),
              "Synthetic local demo input. Not a verified market price.",
              0));
    return Map.of("message", "Synthetic local demo facts added. These are not real-world prices.");
  }
}
