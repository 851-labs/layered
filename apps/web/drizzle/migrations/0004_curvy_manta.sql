PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_blobs` (
	`id` text PRIMARY KEY NOT NULL,
	`content_type` text NOT NULL,
	`file_name` text NOT NULL,
	`file_size` integer NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_blobs`("id", "content_type", "file_name", "file_size", "width", "height", "created_at", "updated_at") SELECT "id", "content_type", "file_name", "file_size", "width", "height", "created_at", "updated_at" FROM `blobs`;--> statement-breakpoint
DROP TABLE `blobs`;--> statement-breakpoint
ALTER TABLE `__new_blobs` RENAME TO `blobs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;