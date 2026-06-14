-- V12__add_user_profile_fields.sql

ALTER TABLE users
ADD COLUMN username VARCHAR(255),
ADD COLUMN profile_image_url TEXT;
