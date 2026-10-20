package ca.duewise;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

record BillInput(
    @NotBlank @Size(max = 120) String name,
    @NotNull @DecimalMin("0.0001") @Digits(integer = 15, fraction = 4) BigDecimal amount,
    @NotBlank @Pattern(regexp = "[A-Z]{3}") String currency,
    @NotNull LocalDate firstDue,
    @NotBlank @Pattern(regexp = "once|weekly|every_n_weeks|monthly|quarterly|yearly")
        String recurrence,
    @Min(1) @Max(52) int everyNWeeks,
    @NotBlank @Pattern(regexp = "clamp|last_day_of_month") String monthEndPolicy,
    @NotBlank @Size(max = 40) String category,
    boolean subscription,
    boolean active,
    @NotNull @Size(max = 10) List<@Min(0) @Max(365) Integer> reminderDays,
    @NotNull @Size(max = 2000) String notes,
    @PositiveOrZero long rowVersion) {}
