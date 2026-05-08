ALTER TABLE `testimonials` RENAME COLUMN `avatar` TO `avatar_path`;--> statement-breakpoint
ALTER TABLE `faqs` DROP COLUMN `is_active`;--> statement-breakpoint
ALTER TABLE `testimonials` DROP COLUMN `is_active`;