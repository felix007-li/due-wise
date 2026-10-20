CREATE TABLE bill (
 id UUID PRIMARY KEY,
 user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 name VARCHAR(120) NOT NULL,
 amount NUMERIC(19,4) NOT NULL CHECK(amount > 0),
 currency VARCHAR(3) NOT NULL,
 first_due DATE NOT NULL,
 recurrence VARCHAR(24) NOT NULL CHECK(recurrence IN ('once','weekly','every_n_weeks','monthly','quarterly','yearly')),
 every_n_weeks INTEGER NOT NULL DEFAULT 1 CHECK(every_n_weeks BETWEEN 1 AND 52),
 month_end_policy VARCHAR(24) NOT NULL CHECK(month_end_policy IN ('clamp','last_day_of_month')),
 category VARCHAR(40) NOT NULL,
 subscription BOOLEAN NOT NULL DEFAULT FALSE,
 active BOOLEAN NOT NULL DEFAULT TRUE,
 reminder_days VARCHAR(80) NOT NULL DEFAULT '3',
 notes VARCHAR(2000) NOT NULL DEFAULT '',
 created_at TIMESTAMP WITH TIME ZONE NOT NULL,
 updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
 row_version BIGINT NOT NULL DEFAULT 0
);
