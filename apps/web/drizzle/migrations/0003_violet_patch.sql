CREATE TABLE `prediction_blobs` (
	`id` text PRIMARY KEY NOT NULL,
	`prediction_id` text NOT NULL,
	`blob_id` text NOT NULL,
	`role` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`prediction_id`) REFERENCES `predictions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`blob_id`) REFERENCES `blobs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_blobs` (
	`id` text PRIMARY KEY NOT NULL,
	`content_type` text NOT NULL,
	`file_name` text NOT NULL,
	`file_size` integer,
	`width` integer,
	`height` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_blobs`("id", "content_type", "file_name", "file_size", "width", "height", "created_at", "updated_at") SELECT "id", "content_type", "file_name", "file_size", "width", "height", "created_at", "updated_at" FROM `blobs`;--> statement-breakpoint
DROP TABLE `blobs`;--> statement-breakpoint
ALTER TABLE `__new_blobs` RENAME TO `blobs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;