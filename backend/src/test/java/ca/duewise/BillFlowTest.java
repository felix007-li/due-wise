package ca.duewise;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.time.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.*;
import tools.jackson.databind.node.ObjectNode;

@SpringBootTest
@AutoConfigureMockMvc
class BillFlowTest {
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;

  MockHttpSession register(String email) throws Exception {
    return (MockHttpSession)
        mvc.perform(
                post("/api/v1/auth/register")
                    .with(csrf())
                    .contentType("application/json")
                    .content("{\"email\":\"" + email + "\",\"password\":\"a-long-test-password\"}"))
            .andExpect(status().isCreated())
            .andReturn()
            .getRequest()
            .getSession();
  }

  ObjectNode input() {
    var n = json.createObjectNode();
    n.put("name", "Rent");
    n.put("amount", "1000.0050");
    n.put("currency", "CAD");
    n.put("firstDue", "2024-01-31");
    n.put("recurrence", "monthly");
    n.put("everyNWeeks", 1);
    n.put("monthEndPolicy", "clamp");
    n.put("category", "Housing");
    n.put("subscription", false);
    n.put("active", true);
    n.putArray("reminderDays").add(3);
    n.put("notes", "");
    n.put("rowVersion", 0);
    return n;
  }

  @Test
  void ownershipReplayPaymentsPauseAndTimezone() throws Exception {
    var a = register("owner@example.test");
    var b = register("other@example.test");
    String bill =
        mvc.perform(
                post("/api/v1/bills")
                    .session(a)
                    .with(csrf())
                    .contentType("application/json")
                    .content(input().toString()))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
    String id = json.readTree(bill).get("id").asText();
    mvc.perform(get("/api/v1/bills/" + id).session(b)).andExpect(status().isNotFound());
    mvc.perform(
            patch("/api/v1/bills/" + id)
                .session(b)
                .with(csrf())
                .contentType("application/json")
                .content(input().toString()))
        .andExpect(status().isNotFound());
    mvc.perform(delete("/api/v1/bills/" + id).session(b).with(csrf()))
        .andExpect(status().isNotFound());
    String url = "/api/v1/calendar?from=2024-02-01&to=2024-03-31";
    var calendar =
        json.readTree(
            mvc.perform(get(url).session(a))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(2))
                .andReturn()
                .getResponse()
                .getContentAsString());
    String occurrence = calendar.get("items").get(0).get("id").asText();
    assertEquals("2024-02-29", calendar.get("items").get(0).get("dueDate").asText());
    mvc.perform(post("/api/v1/occurrences/" + occurrence + "/pay").session(b).with(csrf()))
        .andExpect(status().isNotFound());
    for (int i = 0; i < 2; i++)
      mvc.perform(post("/api/v1/occurrences/" + occurrence + "/pay").session(a).with(csrf()))
          .andExpect(status().isNoContent());
    mvc.perform(get(url).session(a)).andExpect(jsonPath("$.items[0].paid").value(true));
    var settings =
        json.readTree(
            mvc.perform(get("/api/v1/settings").session(a))
                .andReturn()
                .getResponse()
                .getContentAsString());
    mvc.perform(
            put("/api/v1/settings")
                .session(a)
                .with(csrf())
                .contentType("application/json")
                .content(
                    "{\"timezone\":\"Pacific/Auckland\",\"locale\":\"en-CA\",\"currency\":\"CAD\",\"rowVersion\":"
                        + settings.get("rowVersion")
                        + "}"))
        .andExpect(status().isOk());
    mvc.perform(get(url).session(a)).andExpect(jsonPath("$.items[0].dueDate").value("2024-02-29"));
    var edited = input();
    edited.put("amount", "1200");
    edited.put("firstDue", "2024-01-30");
    mvc.perform(
            patch("/api/v1/bills/" + id)
                .session(a)
                .with(csrf())
                .contentType("application/json")
                .content(edited.toString()))
        .andExpect(status().isOk());
    mvc.perform(
            patch("/api/v1/bills/" + id)
                .session(a)
                .with(csrf())
                .contentType("application/json")
                .content(edited.toString()))
        .andExpect(status().isConflict());
    mvc.perform(get(url).session(a))
        .andExpect(jsonPath("$.items[0].paid").value(true))
        .andExpect(jsonPath("$.items[0].amount").value("1000.00"))
        .andExpect(jsonPath("$.items[1].dueDate").value("2024-03-30"));
    mvc.perform(delete("/api/v1/bills/" + id).session(a).with(csrf()))
        .andExpect(status().isNoContent());
    mvc.perform(get(url).session(a))
        .andExpect(jsonPath("$.total").value(1))
        .andExpect(jsonPath("$.items[0].paid").value(true));
    mvc.perform(get("/api/v1/dashboard").session(a))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.calculationVersion").value("schedule-1.0"));
    mvc.perform(get("/api/v1/insights?month=2024-02").session(a))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.roundedCurrencyAmounts.CAD").value("1000.00"));
  }

  @Test
  void validationPaginationAndMoneyIsolation() throws Exception {
    var a = register("validation@example.test");
    var invalid = input();
    invalid.put("amount", "-1");
    mvc.perform(
            post("/api/v1/bills")
                .session(a)
                .with(csrf())
                .contentType("application/json")
                .content(invalid.toString()))
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.fieldErrors.amount").exists());
    invalid = input();
    invalid.put("currency", "ZZZ");
    mvc.perform(
            post("/api/v1/bills")
                .session(a)
                .with(csrf())
                .contentType("application/json")
                .content(invalid.toString()))
        .andExpect(status().isUnprocessableEntity());
    mvc.perform(get("/api/v1/bills?size=10000").session(a)).andExpect(status().isBadRequest());
    mvc.perform(get("/api/v1/calendar?from=2024-01-01&to=2028-01-01").session(a))
        .andExpect(status().isUnprocessableEntity());
  }
}
