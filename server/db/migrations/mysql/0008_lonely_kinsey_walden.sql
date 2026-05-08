ALTER TABLE `gallery` MODIFY COLUMN `order` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `gallery` DROP COLUMN `album`;