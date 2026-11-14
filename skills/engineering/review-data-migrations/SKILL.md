---
name: review-data-migrations
description: "How to review the data migrations of a pull request: check changes to database schemas and persisted formats such as serialized files, preferences, cached payloads and stored wire formats, the upgrade path from every shipped version and how to find those versions, backwards compatibility in both directions, rollback, and the tests for each migration, with Android cases such as Room versions, auto-migrations and exported schemas, destructive fallback, DataStore and proto changes and kotlinx.serialization defaults, and grade each finding blocker, should-fix or nit. Use when checking whether a PR's changes to stored data keep existing users' data readable and intact. Do NOT use when a person asks for a code review or for feedback on a diff, or to write or plan a migration."
---

# Review: data migrations

This review answers five questions about the PR, and only these:

1. Does every change to the shape of stored data come with the version change and migration it
   needs?
2. Does the data every shipped version wrote reach the new shape intact, not only the previous
   version's data?
3. Can new code read old data, and old code read new data, wherever two versions meet the same
   data?
4. Can the project go back to the previous release without users losing data or the app failing
   to start?
5. Does each migration have a test that starts from the shape a shipped version wrote and checks
   the data that comes out?

A change is a finding only when you can name two things: whose data it reaches, as the shipped
or still-running versions that wrote or read it, and what happens there: data lost, reset,
changed in meaning or left unread, or an app or server that crashes or fails to start. A shape
that never shipped, such as a table added earlier on the same unreleased branch, holds no one's
data and needs no migration.

Each check applies to any stack. Where an example names an Android or Kotlin API, check the
equivalent in the stack the PR uses.

## 1. Set the baseline

Before looking for problems, settle these four things.

- **Stored shapes.** List every place the diff changes what is written to storage that outlives
  the process, or how it is read back: database schemas (Room entities and the `@Database`
  version, SQLDelight `.sq` and `.sqm` files, server migrations and ORM models, Core Data models,
  IndexedDB stores); serialized files, and the type converters that store a value in a column;
  `SharedPreferences` and DataStore keys and `.proto` files; cached payloads, on the device or in
  a shared cache such as Redis; and wire formats the app stores, such as a server payload saved
  as it arrived, a request queued for later sending, WorkManager's input `Data`, queue messages,
  and records synced to the user's other devices. A rename can change a stored shape: renaming a
  Kotlin property, an entity class, an enum constant or a sealed subclass changes the name it is
  stored under, unless an annotation pins it (`@SerialName`, `@ColumnInfo(name = ...)`,
  `@Entity(tableName = ...)`).
- **Shipped versions.** A version has shipped once a build of it reached anyone outside
  development: a store release on any track, a production deploy, a published library. Find
  them in release tags (`git tag`, after `git fetch --tags` in a shallow clone), release
  branches, GitHub releases, `CHANGELOG.md`, store changelogs such as
  `fastlane/metadata/android/*/changelogs/`, and the history of `versionCode` in the app's build
  file. Existing migrations are a record too: a `Migration(3, 4)` on the base branch means
  version 3 reached users. When nothing records releases, treat the shape on the base branch as
  shipped, along with every version an existing migration starts from, and say in the finding
  that you could not confirm what shipped.
- **What each shipped version wrote.** Read its shapes at its tag, with `git show v1.4.0:<path>`:
  the `@Database` version, the entities, `.proto` files and `@Serializable` classes as they were
  then, and the `Json { }` configuration that wrote them. Where the project exports Room
  schemas, each version has a file such as `schemas/com.example.AppDatabase/7.json`.
- **Where versions meet.** For each stored shape, note which code writes and reads it, and when
  two versions meet the same data: on a device after an upgrade, which can skip any number of
  versions; on a server during a rolling deploy or staged rollout, and for as long as old clients
  keep calling it; on the user's other devices through sync; and after a rollback.

Review what the diff changes about stored data, and the existing data it newly reads or
rewrites: a new reader of an old file is this diff's case. A stored shape the diff neither
changes nor newly reads is not a finding.

## 2. Check schema changes

For each database whose schema the diff changes:

- **The version moves with the schema.** Any change to a Room entity, view or index, or to the
  list of entities, needs a higher `@Database(version = ...)`. With the same version, Room's
  integrity check throws at first open for every user on that version. SQLDelight needs a new
  `.sqm` file, IndexedDB a higher version, and Core Data a new model version.
- **A migration covers each step, and is registered.** Each step has a `Migration(n, n + 1)`
  passed to `addMigrations`, or an `@AutoMigration` in the `@Database` annotation. A `Migration`
  that is defined but never passed to the builder does not run. With no migration and no
  fallback, Room throws "A migration from n to n+1 was required but not found" at open.
- **The migration produces the new schema exactly.** After migrating, Room compares the database
  with the entities and throws "Migration didn't properly handle" on any difference in a
  column's type, nullability or default, a key, an index or a foreign key, so check the SQL
  against the entity, `@ColumnInfo(defaultValue = ...)` included. SQLite rejects adding a
  `NOT NULL` column with no default. `RENAME COLUMN` needs Android 11 and `DROP COLUMN` Android
  14, unless the app bundles its own SQLite; below that, the migration creates the new table,
  copies the rows, drops the old table and renames the new one.
- **The migration converts the data, not only the shape.** An auto-migration moves columns; it
  does not change what they mean. When a column changes units, encoding or meaning, or a new
  column needs a value that depends on existing rows, a manual migration or an
  `AutoMigrationSpec.onPostMigrate` converts every existing row. A default must be right for
  existing rows, not only valid: `created_at NOT NULL DEFAULT 0` dates every old row to 1970.
  Check that every `@DeleteColumn` and `@DeleteTable` on a spec is a real deletion and not a
  rename, which needs `@RenameColumn` or `@RenameTable`: a deleted column's data is gone.
- **Stored values keep their meaning.** A type converter the diff changes reads every value
  already stored: a `Date` stored as milliseconds and now read as seconds, a list stored as JSON
  in a changed format. An enum stored by ordinal changes meaning when constants are inserted or
  reordered; one stored by name fails on a renamed or removed constant.
- **Destructive fallback only for data the app can rebuild.** `fallbackToDestructiveMigration()`
  and its variants turn every missing migration into a silent wipe of the whole database, from
  then on. A cache the app downloads again in full can be wiped; drafts, unsynced edits, queued
  requests, downloads and anything else only the device holds cannot. Check what the database
  holds.
- **The new schema is recorded.** Where the project exports schemas (`exportSchema = true` with a
  schema directory), the diff adds the file for the new version and leaves the files of shipped
  versions unchanged: auto-migrations and migration tests start from them.
- **Server migrations are new files.** A change goes in a new migration, never in an edit to one
  already applied: Flyway refuses to start on a changed checksum, and Alembic, Django and Rails
  never re-run an applied migration, so databases that already ran it never get the change.
  MySQL commits each DDL statement on its own, so a migration that fails halfway leaves the
  schema half-changed.

Which layer the database code sits in, and whether a query or an index makes it fast, are not
part of this check. Whether every shipped schema reaches the new one with its data is.

## 3. Check persisted-format changes

Files, preferences, caches and stored payloads have no schema version for a framework to check:
the new code reads whatever the old code left. For each format the diff changes, take the data a
shipped version wrote and follow it through the new reader.

- **Added fields.** With kotlinx.serialization, a property with no default is required, so
  decoding old data that lacks it throws `MissingFieldException`; a nullable one is required too
  unless the `Json` instance sets `explicitNulls = false`. Gson builds Kotlin classes without
  running their constructors, so a missing field is `null` even in a non-null property, and the
  crash comes later, where it is read.
- **Changed defaults.** kotlinx.serialization leaves out a property at its default value unless
  `encodeDefaults = true` or `@EncodeDefault` says otherwise. Changing the default changes every
  stored record that held the old one, whether the user chose that value or never touched it.
- **Removed and renamed fields.** A key the class no longer declares makes decoding throw unless
  the `Json` instance sets `ignoreUnknownKeys = true`. A renamed property finds nothing under its
  new key: `@SerialName` keeps the old key, and `@JsonNames` reads both.
- **Enums and class names.** A stored enum value the new code no longer declares makes decoding
  throw, unless `coerceInputValues = true` and the property has a default. A polymorphic type is
  stored under a discriminator that defaults to the class's fully qualified name, so moving or
  renaming a subclass without `@SerialName` breaks every stored record.
- **Protobuf and Proto DataStore.** A field number is never reused or renumbered, its type
  changes only to a wire-compatible one, and a removed field's number and name are marked
  `reserved`. A new field reads as its zero value (`0`, `""`, `false`, the first enum constant)
  for users who already have a file, because a DataStore serializer's `defaultValue` applies only
  when no file exists: a new `text_scale` reads `0`, not the `1.0` the default sets.
- **Preference keys and types.** A renamed key reads as missing, so the user's value falls back
  to the default. A key read as another type than it was written throws `ClassCastException`:
  `getInt` on a stored `String`, an `intPreferencesKey` over a stored `Long`.
- **Store and file names.** Renaming a database file, a `SharedPreferences` file, a
  `preferencesDataStore(name = ...)` or a cache directory starts every user with an empty store.
- **Moves between stores.** Data moved from one store to another is written to the new store
  before the old copy is deleted, and every key moves: a `SharedPreferencesMigration` in
  `produceMigrations` names the right file and keys, and deletes the keys it moves once the new
  store is written.
- **Formats not built to persist.** `Parcelable` bytes are not stable across versions of a
  class, and Java `Serializable` without a fixed `serialVersionUID` rejects old bytes after
  almost any change, so neither belongs in a file, a column or a WorkManager `Data`. WorkManager
  stores each queued worker's class name and input `Data`: renaming or moving a `Worker`, or
  changing the input keys it reads, breaks the work the previous version queued.
- **Caches.** Entries that outlive a release reach the new code. Either it reads them, or a
  format version in the key or the entry makes it ignore them and fetch again.

How a field that is null or unknown in the current format is parsed, and whether stored data is
sensitive and protected, are not part of this check. What happens to the values a shipped
version wrote is.

## 4. Check the upgrade path from every shipped version

Users skip updates. A user who installed the first release and never updated runs every step
between it and the new version in one start. A forced-update floor does not shorten that path:
it stops old versions from running, but their users update straight from them, data included.

For each shipped version from section 1:

- **The chain has no gap.** Follow the migrations from that version's shape to the new one. Room
  takes any registered path, including one that skips versions, but a step missing anywhere on
  the way crashes at open, or wipes the database under a destructive fallback.
- **Old readers and migrations stay.** Removing a migration, a `SharedPreferencesMigration` or
  code that reads an old format strands every user whose data is still in that shape: those who
  skipped the versions that would have converted it. An old shape can go only when no shipped
  version's data can still be in it, or when the project states that it resets data from
  versions older than a named one, for data the user can get back.
- **Each step is written against its own version.** A migration that calls the current DAO,
  entity or `@Serializable` class breaks once those classes change, because it then runs newer
  code against older data. A step works on the tables, columns and formats of its own version:
  in SQL, or with its own copies of the old types.
- **A step completes or leaves the old data intact.** Room and `SQLiteOpenHelper` run migrations
  in a transaction. A step outside one, such as rewriting a file, moving data between stores or
  a server backfill in batches, can be killed halfway. It writes the new copy before deleting
  the old one, and running it again finishes the job without losing or doubling data.

A fresh install, which creates the new shape directly, is not part of this check. Every path from
a shipped shape to the new one is.

## 5. Check compatibility in both directions

Sections 2 to 4 check new code against old data at the upgrade. Where two versions run against
the same data at once, check both directions for as long as they overlap: a rolling deploy, a
staged rollout, the months old clients keep calling the server, sync to the user's other devices.

- **Old data, new code, after the migration.** A migration runs once, but older versions keep
  writing the old shape: an old server instance writing the old column, an old client sending
  the old payload. The new code reads that shape too, until no running version writes it.
- **New data, old code.** Read the shipped versions' code at their tags, since it can no longer
  change, and check what it does with what the new version writes: whether its `Json` instance
  sets `ignoreUnknownKeys`, how it maps an enum constant it does not know, whether it fails on a
  column, file or key it does not expect. An added key, enum constant or message type that a
  shipped version cannot decode crashes it, or makes it drop the record.
- **Round trips.** An old version that reads a record, changes it and writes it back drops every
  field it does not know: JSON decoded into a class and encoded again, a row replaced whole, a
  document overwritten. Protobuf keeps unknown fields through a round trip, and an `UPDATE` of
  named columns leaves the others alone.
- **Server schemas change in steps.** During a deploy, the previous release runs against the
  migrated schema. A column or table it reads or writes is not renamed or dropped in the same
  release, and a new column it does not write is nullable or has a default. The order across
  releases: add the new shape, write both, backfill, move the reads, then drop the old shape
  once no running version uses it.
- **Paths the platform blocks.** Android does not install a lower `versionCode` over a higher
  one, and restores a backup only to the same or a newer version unless the manifest sets
  `android:restoreAnyVersion="true"`. Data that reaches old code only that way is not a finding.

How a server's API stays compatible with old clients, for data it does not store, is not part of
this check. Data that one version stores and another reads is.

## 6. Check rollback

First find how the project goes back to a previous release: a rollback job or runbook, down
migrations, a feature flag around the change. A mobile store cannot downgrade an installed app:
going back means halting a staged rollout, which leaves updated users on the new version, or
shipping the old code again under a higher version number, which then opens the new data.

- **The previous release runs on the new data.** A server rolled back runs the previous release
  against the migrated schema, and the checks of section 5 apply. A mobile build that ships old
  code again crashes at open on a newer Room database, or wipes it where the builder allows
  destructive migration on downgrade.
- **Down migrations restore without loss.** Where the project writes down migrations, the diff
  adds one that restores the previous schema, or marks the step irreversible. A down step that
  drops the new column or table deletes what users wrote since the upgrade.
- **The old copy survives until the new one is trusted.** A release that converts data and
  deletes the old copy in the same step leaves nothing to go back to, or to convert again if the
  conversion was wrong. The old column, file or keys can go in a later release.
- **Flags turn off cleanly.** Data written while a flag was on is read, or safely ignored, once
  it is off.

How a release is rolled out, and when to roll it back, is not part of this check. Whether users'
data survives going back is.

## 7. Check the migration tests

For each migration and each changed stored format, find the test at the PR head that covers it.
A test covers a migration when it:

- **starts from the shipped shape:** it builds the old database from that version's exported
  schema, as Room's `MigrationTestHelper.createDatabase(name, version)` does, or decodes a
  fixture written by the shipped code. A database created from the current entities, or a
  fixture encoded with the current classes, tests nothing about old data;
- **holds the rows that matter:** rows in the old shape, inserted with raw SQL, including the
  values the migration converts and those that could break it, such as a null in a column that
  becomes non-null;
- **checks the result:** `runMigrationsAndValidate` checks the schema, and the test then reads
  the data back and asserts its values;
- **covers the whole path** where the chain is long, from the oldest shipped version to the
  newest through every step.

On a server, the equivalent runs the migrations from a copy of the production schema, and down
again where down migrations exist. SQLDelight's `verifyMigrations` checks the schema, not the
data.

A test that does none of this is no test of the migration, and a migration with no such test is
graded as a missing test, not by the table in section 8. A migration that is wrong, or missing
for a shipped version, is a finding about the code, graded in section 8 by what it breaks,
whether or not a test exists.

How the project names and lays out its tests is not part of this check.

## 8. Grade each finding

Grade by what happens to users' data, and to the app or server, once the new version reaches the
users of a shipped version. Data loss or a crash on upgrade from a shipped version is the
clearest `blocker`.

| Situation | Severity |
|-----------|----------|
| Upgrading from a shipped version loses or corrupts data the user cannot get back: a destructive fallback over data only the device holds, a migration that drops, overwrites or misplaces values, a renamed store or key that leaves the old data unread | `blocker` |
| Upgrading from a shipped version crashes the app or server, or stops it from starting: the version not raised, a step with no migration and no fallback, a migration that does not produce the new schema, stored data the new code cannot decode | `blocker` |
| A version still running during the rollout crashes or loses data on what the new version writes: an old server instance on the new schema, an older client on a synced record, a round trip that drops the new fields | `blocker` |
| An applied server migration is edited, so databases that already ran it never get the change | `blocker` |
| Upgrading from a shipped version resets or flips a value the user can set again, such as a setting, or loses data the app downloads again in full | `should-fix` |
| The previous release, reached the way the project goes back, fails to start or loses data on the new data, or a down migration deletes what users wrote since the upgrade | `should-fix` |
| A step outside a transaction, killed halfway, loses or doubles data | `should-fix` |
| A migration uses the current entity, DAO or serializable classes, so a later change to them breaks it | `should-fix` |
| The new schema version is not exported where the project exports schemas, or a shipped version's schema file is changed | `should-fix` |
| A migration leaves the old store, file or keys behind once nothing reads them | `nit` |

When the step goal or an acceptance criterion asks for the change to be reversible, a rollback
finding is a `blocker`. Wiping a cache that the app rebuilds in full from its source is not a
finding.

## 9. Write the findings

Each finding names whose data the problem reaches, as a shipped or still-running version, and
what happens to that data or to the app. Point the location at the line that changes the stored
shape or should carry the migration: the entity field, the `@Database` version, the builder
call, the `.proto` field, the serializable property, the migration file. For a step with no
migration, point at the `@Database` version.

From check to finding:

- The diff raises the version from 8 to 9 with no migration, the builder already calls
  `fallbackToDestructiveMigration()`, and the database holds drafts not yet synced.
  → `[blocker] app/src/main/java/data/AppDatabase.kt:12 - no migration from 8 to 9, so the destructive fallback deletes every upgrading user's unsynced drafts`
- The diff deletes `MIGRATION_1_2` and `MIGRATION_2_3`; tag `v1.0.0` shipped database version 1.
  → `[blocker] app/src/main/java/data/DatabaseModule.kt:30 - removes the migrations from versions 1 and 2, so users still on 1.0 crash at first open after updating`
- A server migration renames `users.name` to `users.full_name` in the release that moves the code
  to `full_name`.
  → `[blocker] db/migrations/V42__rename_user_name.sql:1 - renames a column the previous release still reads, so its instances fail every user query during the rolling deploy; add full_name, write both, and drop name in a later release`
- The diff changes `val notificationsEnabled: Boolean = true` to `= false` in a class stored with
  the default `Json` settings.
  → `[should-fix] core/settings/src/main/kotlin/settings/Settings.kt:9 - stored settings omit notificationsEnabled when it held the old default, so every user who had notifications on, by default or by choice, has them off after the update`
- A migration test builds version 3 with `Room.inMemoryDatabaseBuilder` and the current entities,
  then calls `MIGRATION_3_4.migrate`.
  → `[nit] app/src/androidTest/java/data/MigrationTest.kt:24 - builds the version-3 database from the current entities, so MIGRATION_3_4 never runs on the schema version 3 shipped with`
