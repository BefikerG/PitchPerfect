-- Prevent exact-duplicate confirmed bookings at the DB level
CREATE UNIQUE INDEX idx_booking_no_exact_dup ON bookings(pitch_id, start_time) WHERE status = 'CONFIRMED';
