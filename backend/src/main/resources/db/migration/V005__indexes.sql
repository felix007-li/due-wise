CREATE INDEX bill_owner_due ON bill(user_id,first_due);
CREATE INDEX occurrence_owner_date ON occurrence(user_id,due_date);
CREATE INDEX payment_owner_created ON payment(user_id,created_at);
CREATE INDEX notification_owner_date ON notification_delivery(user_id,delivery_date);
CREATE INDEX snapshot_owner_date ON projection_snapshot(user_id,as_of_date);
CREATE UNIQUE INDEX reminder_owner ON reminder_preference(user_id);
