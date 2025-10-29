-- Add survivor pseudonym and level fields to users
ALTER TABLE "User"
  ADD COLUMN "pseudonym" TEXT,
  ADD COLUMN "level" INTEGER NOT NULL DEFAULT 1;

WITH numbered AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS row_number
  FROM "User"
)
UPDATE "User" AS u
SET "pseudonym" = 'SURVIVOR' || LPAD((numbered.row_number - 1)::text, 4, '0')
FROM numbered
WHERE u."id" = numbered."id";

ALTER TABLE "User"
  ALTER COLUMN "pseudonym" SET NOT NULL;

CREATE UNIQUE INDEX "User_pseudonym_key" ON "User"("pseudonym");
