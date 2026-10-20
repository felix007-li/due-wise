package ca.duewise;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@org.springframework.core.annotation.Order(org.springframework.core.Ordered.HIGHEST_PRECEDENCE)
class RequestLogFilter extends OncePerRequestFilter {
  protected void doFilterInternal(
      HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    String id = UUID.randomUUID().toString();
    req.setAttribute("requestId", id);
    res.setHeader("X-Request-ID", id);
    long start = System.nanoTime();
    try {
      chain.doFilter(req, res);
    } finally {
      LoggerFactory.getLogger(getClass())
          .info(
              "event=request requestId={} method={} status={} durationMs={}",
              id,
              req.getMethod(),
              res.getStatus(),
              (System.nanoTime() - start) / 1_000_000);
    }
  }
}
