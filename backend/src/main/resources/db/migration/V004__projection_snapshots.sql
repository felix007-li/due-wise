CREATE TABLE projection_snapshot (
 id UUID PRIMARY KEY,
 user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 as_of_date DATE NOT NULL,
 calculation_version VARCHAR(40) NOT NULL,
 assumptions VARCHAR(2000) NOT NULL,
 payload TEXT NOT NULL,
 created_at TIMESTAMP WITH TIME ZONE NOT NULL,
 updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
 row_version BIGINT NOT NULL DEFAULT 0
);
