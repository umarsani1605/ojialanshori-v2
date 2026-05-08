ALTER TABLE `users` RENAME COLUMN `name` TO `fullname`;--> statement-breakpoint
ALTER TABLE `users` RENAME COLUMN `password_hash` TO `password`;--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `users_username_unique`;--> statement-breakpoint
ALTER TABLE `users` ADD `nickname` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `year_study` year;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `username`;