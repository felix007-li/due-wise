package ca.duewise;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class AuthTest {
  @Autowired MockMvc mvc;

  @Test
  void registrationNeedsCsrf() throws Exception {
    mvc.perform(post("/api/v1/auth/register").contentType("application/json").content("{}"))
        .andExpect(status().isForbidden());
  }

  @Test
  void registrationCreatesSessionAndLogoutRevokesIt() throws Exception {
    var result =
        mvc.perform(
                post("/api/v1/auth/register")
                    .with(csrf())
                    .contentType("application/json")
                    .content(
                        "{\"email\":\"auth@example.test\",\"password\":\"a-long-test-password\"}"))
            .andExpect(status().isCreated())
            .andReturn();
    var session = (org.springframework.mock.web.MockHttpSession) result.getRequest().getSession();
    mvc.perform(get("/api/v1/auth/me").session(session))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.email").value("auth@example.test"))
        .andExpect(jsonPath("$.passwordHash").doesNotExist());
    mvc.perform(post("/api/v1/auth/logout").session(session).with(csrf()))
        .andExpect(status().isNoContent());
    Assertions.assertTrue(session.isInvalid());
  }

  @Test
  void badLoginUsesGenericError() throws Exception {
    mvc.perform(
            post("/api/v1/auth/login")
                .with(csrf())
                .contentType("application/json")
                .content(
                    "{\"email\":\"missing@example.test\",\"password\":\"a-long-test-password\"}"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
  }
}
