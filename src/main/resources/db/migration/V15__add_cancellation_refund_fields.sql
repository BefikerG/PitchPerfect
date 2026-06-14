-- Add cancellation response and refund status columns to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_response VARCHAR(500);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_refund_status VARCHAR(20) NOT NULL DEFAULT 'NONE';
