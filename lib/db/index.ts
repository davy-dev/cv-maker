import "server-only";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";

const dbPath =
  process.env.DATABASE_PATH ??
  path.join(process.cwd(), "data", "cv-maker.db");
const sqlite = new Database(dbPath);

// WAL lets reads run during a write. The mode is stored in the file, so it is set once; processes
// opening a fresh database together (next build's workers) may find it locked by the one switching
// it, and can go on: reads work in any mode.
try {
  if (sqlite.pragma("journal_mode", { simple: true }) !== "wal") sqlite.pragma("journal_mode = WAL");
} catch (error) {
  if (!(error instanceof Database.SqliteError && error.code === "SQLITE_BUSY")) throw error;
}

export const db = drizzle(sqlite, { schema });
