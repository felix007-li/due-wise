package ca.duewise;

import java.math.BigDecimal;
import org.springframework.boot.jackson.autoconfigure.JsonMapperBuilderCustomizer;
import org.springframework.context.annotation.*;
import tools.jackson.databind.module.SimpleModule;
import tools.jackson.databind.ser.std.ToStringSerializer;

@Configuration
class JsonConfig {
  /** Preserve all decimal digits across JavaScript clients. */
  @Bean
  JsonMapperBuilderCustomizer decimalStrings() {
    return builder ->
        builder.addModule(
            new SimpleModule().addSerializer(BigDecimal.class, ToStringSerializer.instance));
  }
}
