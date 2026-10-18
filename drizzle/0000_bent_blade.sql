CREATE TABLE `owners` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `visits` (
	`id` text PRIMARY KEY NOT NULL,
	`country` text NOT NULL,
	`data` text NOT NULL,
	`created_at` text NOT NULL
);
