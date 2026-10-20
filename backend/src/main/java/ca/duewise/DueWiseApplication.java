package ca.duewise;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(
    exclude =
        org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration.class)
public class DueWiseApplication {
  public static void main(String[] args) {
    SpringApplication.run(DueWiseApplication.class, args);
  }
}
