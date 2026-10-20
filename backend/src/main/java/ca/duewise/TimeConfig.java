package ca.duewise;

import java.time.Clock;
import org.springframework.context.annotation.*;

@Configuration
class TimeConfig {
  @Bean
  Clock clock() {
    return Clock.systemUTC();
  }
}
