UPDATE `users` SET `role` = 'admin' WHERE `role` IN ('superadmin', 'pengurus');
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','reviewer','santri') NOT NULL DEFAULT 'santri';