# GymBud — Project Inventory Index

This folder is the **single source of truth** for codegen and architecture decisions.  
Everything here is normalized to match the live system.

## Quick Links
- [`01_REPO_RUNTIME.md`](./01_REPO_RUNTIME.md)
- [`02_ENV_TARGETS.md`](./02_ENV_TARGETS.md)
- [`03_DB_SCHEMA.sql`](./03_DB_SCHEMA.sql)
- [`03_DB_NOTES.md`](./03_DB_NOTES.md)
- (coming next) `04_API_SURFACE.md`, `05_TYPES_SCHEMAS.md`, …

## Database CSV Catalog (authoritative extracts)
- [`manifest.csv`](./manifest.csv)
- [`db_tables.csv`](./db_tables.csv)
- [`db_columns.csv`](./db_columns.csv)
- [`db_constraints_pk_uniq.csv`](./db_constraints_pk_uniq.csv)
- [`db_foreign_keys.csv`](./db_foreign_keys.csv)
- [`db_indexes.csv`](./db_indexes.csv)
- [`db_checks.csv`](./db_checks.csv)
- [`db_rls_policies.csv`](./db_rls_policies.csv)
- [`db_rls_tables.csv`](./db_rls_tables.csv)
- [`db_triggers.csv`](./db_triggers.csv)
- [`db_functions.csv`](./db_functions.csv)
- [`db_views.csv`](./db_views.csv)
- [`db_matviews.csv`](./db_matviews.csv)
- [`db_enums.csv`](./db_enums.csv)
- [`db_sequences.csv`](./db_sequences.csv)
- [`db_table_comments.csv`](./db_table_comments.csv)
- [`db_reference_candidates.csv`](./db_reference_candidates.csv)

### Regeneration
Run the provided Supabase SQL blocks in the SQL Editor and **Download as CSV** for each result.  
Update files in place; keep `manifest.csv` current.

### Trust Order
1. Migrations (`supabase/migrations/*`)
2. Schema dump (`03_DB_SCHEMA.sql`)
3. CSV snapshots (this catalog)
