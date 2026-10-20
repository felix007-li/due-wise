package ca.duewise;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(
    properties = "spring.datasource.url=jdbc:h2:mem:demo;MODE=PostgreSQL;DB_CLOSE_DELAY=-1")
@AutoConfigureMockMvc
@ActiveProfiles("local")
class DemoTest {
  @Autowired MockMvc mvc;

  @Test
  void localFixturesAreOptInLabelledAndCannotBeRepeated() throws Exception {
    var session =
        (MockHttpSession)
            mvc.perform(
                    post("/api/v1/auth/register")
                        .with(csrf())
                        .contentType("application/json")
                        .content(
                            "{\"email\":\"demo-test@example.test\",\"password\":\"a-long-test-password\"}"))
                .andExpect(status().isCreated())
                .andReturn()
                .getRequest()
                .getSession();
    mvc.perform(get("/api/v1/bills").session(session)).andExpect(jsonPath("$.total").value(0));
    mvc.perform(post("/api/v1/account/demo").session(session).with(csrf()))
        .andExpect(status().isCreated())
        .andExpect(
            jsonPath("$.message")
                .value("Synthetic local demo facts added. These are not real-world prices."));
    mvc.perform(get("/api/v1/bills").session(session))
        .andExpect(jsonPath("$.total").value(4))
        .andExpect(jsonPath("$.items[0].name").value("Demo · Rent"));
    mvc.perform(post("/api/v1/account/demo").session(session).with(csrf()))
        .andExpect(status().isConflict());
  }
}
