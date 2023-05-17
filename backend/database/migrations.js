import fs from "fs";

import { fileURLToPath } from "url";
import { dirname } from "path";

import { backup } from "../db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

var migration1 = fs
  .readFileSync(__dirname + "/migration_1.sql", "utf8")
  .toString();
var migration2 = fs
  .readFileSync(__dirname + "/migration_2.sql", "utf8")
  .toString();

const currentCodeVersion = 2;

const migrateToVersion = {
  1: { sql: migration1 },
  2: { sql: migration2 },
};

const testMigrationTableExistence = async ({ pool }) => {
  const sql = `
            SELECT EXISTS (
                SELECT 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                    AND table_name = 'migrations'
            );`;
  const res = await pool.query(sql);
  if (res.error) {
    console.log(res.error);
    console.trace();
    return;
  }
  if (res.rows && res.rows[0]) {
    if (!(res.rows[0].exists === true)) {
      // migrations table does not exist yet
      return false;
    }
  } else {
    console.log("Could not query stated database for migrations table.");
    console.trace();
  }
};

const getLatestMigrationVersion = async ({ pool }) => {
  const sql = `SELECT MAX(to_version) max_version FROM migrations`;
  const res = await pool.query(sql);
  if (res.error) {
    console.log("res error", res.error);
    console.trace();
  } else {
    const maxVersion = res.rows[0].max_version;
    if (/^[0-9]+$/.test("" + maxVersion)) { // positive integer
      return maxVersion;
    }
  }
  return;
};

const _performMigrations = async ({ pool, cb }) => {
  const migrationsTableExists = await testMigrationTableExistence({ pool });
  if (!migrationsTableExists) {
    const backupResult = await backup();
    if (backupResult.error) {
      console.log(backupResult.error);
      console.trace();
      return;
    }
    const targetVersion = 1;
    const sql = migrateToVersion[targetVersion]["sql"];
    const migrationResult = await pool.query(sql);
    console.log("migration from 0 to " + targetVersion, migrationResult);
    const trackMigration = `INSERT INTO migrations (created_at, from_version, to_version) VALUES (CURRENT_TIMESTAMP, $1, $2)`;
    const res = await pool.query(trackMigration, ["0", targetVersion]);
    if (res.error) {
      console.log(res.error);
      return;
    }
  } else {
    const maxVersion = await getLatestMigrationVersion({ pool });
    if (maxVersion === "" + currentCodeVersion) {
      cb();
    } else {
      const dbVersion = parseInt(maxVersion);
      const targetVersion = dbVersion + 1;
      if (targetVersion > 1 && migrateToVersion[targetVersion]) {
        const backupResult = await backup();
        if (backupResult.error) {
          console.log(backupResult.error);
          console.trace();
          return;
        }
        const sql = migrateToVersion[targetVersion]["sql"];
        const res = await pool.query(sql);
        console.log(
          "migration from " + dbVersion + " to " + targetVersion,
          res
        );
        if (res.error) {
          return;
        } else {
          const sql = `INSERT INTO migrations (created_at, from_version, to_version) VALUES (CURRENT_TIMESTAMP, $1, $2)`;
          const res = await pool.query(sql, [dbVersion, targetVersion]);
          if (res.error) {
            console.log(res.error);
            return;
          }
        }
      }
    }
  }
};

export const performMigrations = async ({ pool, cb }) => {
  try {
    _performMigrations({ pool, cb });
  } catch (error) {
    console.log(error);
    console.trace();
  }
};
