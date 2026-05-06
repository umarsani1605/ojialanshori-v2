ALTER TABLE `posts` RENAME COLUMN `rejection_note` TO `review_note`;--> statement-breakpoint
ALTER TABLE `posts` MODIFY COLUMN `review_note` longtext;--> statement-breakpoint
ALTER TABLE `posts` ADD `reviewed_by` int;--> statement-breakpoint
ALTER TABLE `posts` ADD CONSTRAINT `posts_reviewed_by_users_id_fk` FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
