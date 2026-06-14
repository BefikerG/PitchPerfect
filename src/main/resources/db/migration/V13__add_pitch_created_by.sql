-- V13__add_pitch_created_by.sql

ALTER TABLE pitches
ADD COLUMN created_by_id BIGINT,
ADD CONSTRAINT fk_pitches_created_by FOREIGN KEY (created_by_id) REFERENCES users(id);

-- For existing pitches, assume the manager is the creator
UPDATE pitches SET created_by_id = manager_id WHERE created_by_id IS NULL;
