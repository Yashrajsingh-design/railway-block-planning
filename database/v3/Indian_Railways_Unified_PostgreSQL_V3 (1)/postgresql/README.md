# Unified PostgreSQL Database

This is the PostgreSQL implementation package for the V3 synthetic railway block-planning model.

It contains:
- 22 normalized tables
- foreign-key relationships for the core network/maintenance/request/operations model
- indexes for optimizer-oriented queries
- canonical optimizer views
- CSV bulk-load script
- post-load validation SQL

The actual PostgreSQL server is NOT embedded in this ZIP. PostgreSQL is a server/database service, so these scripts are the deployable database definition and seed-loader.

Recommended database schemas for a production implementation:
raw (source landing), staging (validated/normalized), core (canonical), planning (scenarios/plans), audit (lineage/execution).

For the current prototype, the supplied V3 CSVs are the seed data. The existing SQLite file remains useful for local/offline inspection.
