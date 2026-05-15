-- Add GPS accuracy columns to track browser Geolocation API accuracy
ALTER TABLE attendance_records
ADD COLUMN check_in_accuracy DECIMAL(8,2),
ADD COLUMN check_out_accuracy DECIMAL(8,2);

-- Create index for accuracy queries (to find poor accuracy readings)
CREATE INDEX IF NOT EXISTS idx_attendance_accuracy ON attendance_records(check_in_accuracy);
