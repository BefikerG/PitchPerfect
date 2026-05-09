-- Altering a table demonstrates schema evolution
ALTER TABLE bookings ADD COLUMN cancellation_reason VARCHAR(255);