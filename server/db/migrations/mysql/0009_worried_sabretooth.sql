CREATE TABLE IF NOT EXISTS `activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`image_path` varchar(500) NOT NULL,
	`order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `board_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`role` varchar(100) NOT NULL,
	`avatar_path` varchar(500),
	`order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `board_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
-- DROP TABLE `contacts`;--> statement-breakpoint
-- DELETE FROM `pages`;--> statement-breakpoint
-- ALTER TABLE `pages` DROP INDEX `pages_slug_unique`;--> statement-breakpoint
ALTER TABLE `pages` ADD `template` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `pages` ADD `meta` json DEFAULT ('{}') NOT NULL;--> statement-breakpoint
ALTER TABLE `pages` ADD CONSTRAINT `pages_template_unique` UNIQUE(`template`);--> statement-breakpoint
ALTER TABLE `pages` DROP COLUMN `slug`;--> statement-breakpoint
ALTER TABLE `pages` DROP COLUMN `content`;--> statement-breakpoint
ALTER TABLE `pages` DROP COLUMN `status`;