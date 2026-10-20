package ca.duewise;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class BootstrapTest {
  @Autowired MockMvc mvc;

  @Test
  void healthIsPublic() throws Exception {
    mvc.perform(get("/health"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("UP"));
  }

  @Test
  void openApiDescribesHealth() throws Exception {
    mvc.perform(get("/v3/api-docs"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.paths['/health']").exists());
  }

  @Test
  void privateApiIsNotPublic() throws Exception {
    var response =
        mvc.perform(get("/api/v1/bills"))
            .andExpect(status().isUnauthorized())
            .andReturn()
            .getResponse();
    var requestId = response.getHeader("X-Request-ID");
    org.junit.jupiter.api.Assertions.assertNotNull(requestId);
    java.util.UUID.fromString(requestId);
    org.junit.jupiter.api.Assertions.assertTrue(response.getContentAsString().contains(requestId));
  }
}
