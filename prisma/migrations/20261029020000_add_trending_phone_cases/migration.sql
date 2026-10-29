-- Add the additional default storefront subcategories without duplicating existing records.
INSERT INTO "Subcategory" ("id", "name", "slug", "description", "sortOrder", "categoryId", "updatedAt")
VALUES
  ('subcategory-trending', 'Trending', 'trending', '', 5, NULL, CURRENT_TIMESTAMP),
  ('subcategory-phone-cases', 'Phone-Cases', 'phone-cases', '', 6, NULL, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
