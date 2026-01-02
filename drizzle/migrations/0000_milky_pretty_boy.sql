CREATE TABLE `generations` (
	`id` text PRIMARY KEY NOT NULL,
	`input_url` text NOT NULL,
	`layers` text NOT NULL,
	`created_at` integer NOT NULL
);
