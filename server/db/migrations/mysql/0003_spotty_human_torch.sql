CREATE TABLE `faqs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`question` varchar(500) NOT NULL,
	`answer` text NOT NULL,
	`order` int NOT NULL DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `faqs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `avatar` varchar(500);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `university` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `faculty` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `major` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `year_enrolled` year;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `avatar_path`;