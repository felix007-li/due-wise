package ca.duewise;

import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import tools.jackson.databind.ObjectMapper;

@Configuration
class SecurityConfig {
  @Bean
  PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12);
  }

  @Bean
  SecurityFilterChain security(HttpSecurity http, ObjectMapper json, UserRepository users)
      throws Exception {
    return http.addFilterAfter(
            new AccountSessionFilter(users, json),
            org.springframework.security.web.context.SecurityContextHolderFilter.class)
        .authorizeHttpRequests(
            a ->
                a.requestMatchers(
                        "/health",
                        "/actuator/health",
                        "/v3/api-docs/**",
                        "/swagger-ui/**",
                        "/swagger-ui.html",
                        "/api/v1/auth/csrf",
                        "/api/v1/auth/register",
                        "/api/v1/auth/login")
                    .permitAll()
                    .anyRequest()
                    .authenticated())
        .exceptionHandling(
            e ->
                e.authenticationEntryPoint(
                        (req, res, ex) -> {
                          res.setStatus(401);
                          res.setContentType("application/json");
                          json.writeValue(
                              res.getOutputStream(),
                              ApiErrors.body(
                                  "UNAUTHORIZED", "Sign in to continue.", java.util.Map.of(), req));
                        })
                    .accessDeniedHandler(
                        (req, res, ex) -> {
                          res.setStatus(403);
                          res.setContentType("application/json");
                          json.writeValue(
                              res.getOutputStream(),
                              ApiErrors.body(
                                  "FORBIDDEN",
                                  "Refresh your session and try again.",
                                  java.util.Map.of(),
                                  req));
                        }))
        .logout(
            l ->
                l.logoutUrl("/api/v1/auth/logout")
                    .logoutSuccessHandler((req, res, a) -> res.setStatus(204)))
        .build();
  }
}
