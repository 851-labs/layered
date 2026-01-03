-- Add status column to predictions
ALTER TABLE `predictions` ADD COLUMN `status` text NOT NULL DEFAULT 'processing';

