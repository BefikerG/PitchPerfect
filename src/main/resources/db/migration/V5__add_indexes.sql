-- Required for performance and the search/filter endpoints
CREATE INDEX idx_pitch_location ON pitches(location);
CREATE INDEX idx_booking_dates ON bookings(start_time, end_time);