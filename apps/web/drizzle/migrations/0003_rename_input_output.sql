-- Rename inputs to input and outputs to output
ALTER TABLE `predictions` RENAME COLUMN `inputs` TO `input`;
ALTER TABLE `predictions` RENAME COLUMN `outputs` TO `output`;

