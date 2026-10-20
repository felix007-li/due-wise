package ca.duewise;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.ObjectMapper;

/** Revokes every existing session on its next request after account deletion. */
class AccountSessionFilter extends OncePerRequestFilter {
  final UserRepository users;
  final ObjectMapper json;

  AccountSessionFilter(UserRepository u, ObjectMapper j) {
    users = u;
    json = j;
  }

  protected void doFilterInternal(
      HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws IOException, ServletException {
    var authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication != null && authentication.isAuthenticated()) {
      boolean exists;
      try {
        exists = users.existsById(UUID.fromString(authentication.getName()));
      } catch (IllegalArgumentException e) {
        exists = false;
      }
      if (!exists) {
        SecurityContextHolder.clearContext();
        if (req.getSession(false) != null) req.getSession(false).invalidate();
        res.setStatus(401);
        res.setContentType("application/json");
        json.writeValue(
            res.getOutputStream(),
            ApiErrors.body("UNAUTHORIZED", "Sign in to continue.", Map.of(), req));
        return;
      }
    }
    chain.doFilter(req, res);
  }
}
