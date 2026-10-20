package ca.duewise;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.time.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.*;

@SpringBootTest
@AutoConfigureMockMvc
class DataReminderTest {
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired JdbcTemplate jdbc;

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

  @Test
  void exportAndDeletionAreOwnerScopedAndReauthenticated() throws Exception {
    var a = register("export@example.test");
    var b = register("survivor@example.test");
    // Use structured JSON serialization so quoted notes remain valid.
    var node = json.createObjectNode();
    node.put("name", "=HYPERLINK(test)");
    node.put("amount", "999999999999999.1234");
    node.put("currency", "CAD");
    node.put("firstDue", "2026-10-01");
    node.put("recurrence", "monthly");
    node.put("everyNWeeks", 1);
    node.put("monthEndPolicy", "clamp");
    node.put("category", "Other");
    node.put("subscription", true);
    node.put("active", true);
    node.putArray("reminderDays").add(3);
    node.put("notes", "A quote: \"hi\"");
    node.put("rowVersion", 0);
    mvc.perform(
            post("/api/v1/bills")
                .session(a)
                .with(csrf())
                .contentType("application/json")
                .content(node.toString()))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.amount").value("999999999999999.1234"));
    String csv =
        mvc.perform(get("/api/v1/account/export?format=csv").session(a))
            .andExpect(status().isOk())
            .andExpect(header().string("Cache-Control", "no-store"))
            .andReturn()
            .getResponse()
            .getContentAsString();
    assertTrue(csv.contains("\"'=HYPERLINK(test)\""));
    assertTrue(csv.contains("\"\"hi\"\""));
    mvc.perform(get("/api/v1/account/export").session(b)).andExpect(jsonPath("$.bills").isEmpty());
    mvc.perform(get("/api/v1/account/export").session(a))
        .andExpect(jsonPath("$.settings.passwordHash").doesNotExist())
        .andExpect(jsonPath("$.bills[0].amount").value("999999999999999.1234"));
    mvc.perform(get("/api/v1/dashboard").session(a)).andExpect(status().isOk());
    mvc.perform(
            delete("/api/v1/account")
                .session(a)
                .with(csrf())
                .contentType("application/json")
                .content("{\"password\":\"wrong\",\"confirmation\":\"DELETE\"}"))
        .andExpect(status().isUnprocessableEntity());
    mvc.perform(
            delete("/api/v1/account")
                .session(a)
                .with(csrf())
                .contentType("application/json")
                .content("{\"password\":\"a-long-test-password\",\"confirmation\":\"DELETE\"}"))
        .andExpect(status().isNoContent());
    assertTrue(a.isInvalid());
    mvc.perform(get("/api/v1/auth/me").session(b)).andExpect(status().isOk());
  }

  @Test
  void reminderLocalDateOffsetAndDeliveryAreIdempotent() throws Exception {
    var a = register("reminder@example.test");
    String due = LocalDate.now(ZoneId.of("America/Toronto")).plusDays(3).toString();
    var node = json.createObjectNode();
    node.put("name", "Synthetic reminder fixture");
    node.put("amount", "9.99");
    node.put("currency", "CAD");
    node.put("firstDue", due);
    node.put("recurrence", "once");
    node.put("everyNWeeks", 1);
    node.put("monthEndPolicy", "clamp");
    node.put("category", "Other");
    node.put("subscription", false);
    node.put("active", true);
    node.putArray("reminderDays").add(3);
    node.put("notes", "");
    node.put("rowVersion", 0);
    mvc.perform(
            post("/api/v1/bills")
                .session(a)
                .with(csrf())
                .contentType("application/json")
                .content(node.toString()))
        .andExpect(status().isCreated());
    String owner =
        json.readTree(
                mvc.perform(get("/api/v1/auth/me").session(a))
                    .andReturn()
                    .getResponse()
                    .getContentAsString())
            .get("id")
            .asText();
    for (int i = 0; i < 2; i++)
      mvc.perform(get("/api/v1/reminders").session(a))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.items[0].dueDate").value(due));
    assertEquals(
        1,
        jdbc.queryForObject(
            "SELECT COUNT(*) FROM notification_delivery WHERE user_id=?",
            Integer.class,
            UUID.fromString(owner)));
    mvc.perform(
            put("/api/v1/reminders/preference")
                .session(a)
                .with(csrf())
                .contentType("application/json")
                .content("{\"enabled\":false}"))
        .andExpect(status().isNoContent());
    mvc.perform(get("/api/v1/reminders").session(a))
        .andExpect(jsonPath("$.enabled").value(false))
        .andExpect(jsonPath("$.items").isEmpty());
  }

  @Test
  void csvFormulaAndQuoteBoundaries() {
    assertEquals("\"'=2+2\"", DataController.cell("=2+2"));
    assertEquals("\"a,\"\"b\"\"\"", DataController.cell("a,\"b\""));
    assertEquals("\"'\t=2+2\"", DataController.cell("\t=2+2"));
  }
}
