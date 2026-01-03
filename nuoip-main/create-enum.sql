
-- Create UserRole enum if it doesn't exist
DO $$
BEGIN
  CREATE TYPE "UserRole" AS ENUM ('super_admin', 'admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'UserRole enum already exists';
END
$$; 
