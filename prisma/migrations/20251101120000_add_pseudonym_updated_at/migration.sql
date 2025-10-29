-- Track last pseudonym update to enforce cooldown
ALTER TABLE "User"
  ADD COLUMN "pseudonymUpdatedAt" TIMESTAMP(3);
