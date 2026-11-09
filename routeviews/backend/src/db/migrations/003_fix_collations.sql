-- Normalize the collation of every places-system table to
-- utf8mb4_unicode_ci, so joins across them never hit
-- "Illegal mix of collations".
--
-- Safe and additive: no data is dropped or truncated. ALTER ... CONVERT
-- only changes charset/collation metadata and rebuilds indexes. Existing
-- rows are preserved. All tables involved are small.

ALTER TABLE places               CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE place_accessibility  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE place_photos         CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE place_submissions    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE business_claims      CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE staff_members        CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE staff_attendance     CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;