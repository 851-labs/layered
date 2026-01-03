-- Drop old generations table
DROP TABLE IF EXISTS `generations`;

-- Create predictions table
CREATE TABLE `predictions` (
	`id` text PRIMARY KEY NOT NULL,
	`endpoint_id` text NOT NULL,
	`inputs` text NOT NULL,
	`outputs` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);

-- Create blobs table
CREATE TABLE `blobs` (
	`id` text PRIMARY KEY NOT NULL,
	`prediction_id` text NOT NULL,
	`content_type` text NOT NULL,
	`file_name` text NOT NULL,
	`file_size` integer,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);

