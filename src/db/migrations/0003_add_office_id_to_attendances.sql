-- Add office_id column to attendances table
ALTER TABLE "attendances" ADD COLUMN "office_id" bigint;

-- Add foreign key constraint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_office_id_master_office_id_fk" 
  FOREIGN KEY ("office_id") REFERENCES "master_office"("id") ON DELETE no action ON UPDATE no action;

-- Add index for office_id
CREATE INDEX IF NOT EXISTS "idx_attendances_office" ON "attendances" ("office_id");
