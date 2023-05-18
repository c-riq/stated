// @ts-nocheck

import fs from "fs";

import { backup } from "../db"

import { transaction } from "./transaction"

import { Pool } from "pg"

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

const testMigrationTableExistence = (pool: Pool) => new Promise((resolve, reject) => {
  const sql = `
            SELECT EXISTS (
                SELECT 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                    AND table_name = 'migrations'
            );`;
  pool.query(sql, (error, res) => {
    if (error) {
      console.log(error)
      console.trace()
      resolve({ error })
    } else {
      if (res.rows && res.rows[0]) {
        if (!(res.rows[0].exists === true)) {
          // migrations table does not exist yet
          return resolve(false);
        }
      } else {
        console.log("Could not query stated database for migrations table.");
        console.trace();
      }
  }})
})

const getLatestMigrationVersion = (pool: Pool) => new Promise((resolve, reject) => {
  const sql = `SELECT MAX(to_version) max_version FROM migrations`;
  pool.query(sql, (error, res) => {
  if (error) {
    console.log("res error", error);
    console.trace();
  } else {
    const maxVersion = res.rows[0].max_version;
    if (/^[0-9]+$/.test("" + maxVersion)) {
      // positive integer
      return maxVersion;
    }
  }})
})

const _performMigrations = async (pool: Pool, cb: () => any) => {
  const migrationsTableExists = await testMigrationTableExistence(pool);
  if (!migrationsTableExists) {
    const backupResult = await backup();
    if (backupResult.error) {
      console.log(backupResult.error);
      console.trace();
      return;
    }
    transaction(async (client) => {
      const targetVersion = 1;
      const sql = migrateToVersion[targetVersion]["sql"];
      console.log("migrating from 0 to version " + targetVersion);
      const res = await client.query(
        sql +
          `;INSERT INTO migrations (created_at, from_version, to_version) VALUES (CURRENT_TIMESTAMP, 0, $1)`
      , [targetVersion]);
    }, pool);
  } else {
    const maxVersion = await getLatestMigrationVersion(pool);
    if (maxVersion === "" + currentCodeVersion) {
      cb();
    } else {
      const dbVersion = parseInt('' + maxVersion);
      const targetVersion = dbVersion + 1;
      if (targetVersion > 1 && migrateToVersion[targetVersion]) {
        const backupResult = await backup();
        if (backupResult.error) {
          console.log(backupResult.error);
          console.trace();
          return;
        }
        transaction(async (client) => {
          const targetVersion = 1;
          const sql = migrateToVersion[targetVersion]["sql"];
          console.log(`migrating from ${dbVersion} to version ${targetVersion}`);
          const res = await client.query(
            sql +
              `;INSERT INTO migrations (created_at, from_version, to_version) VALUES (CURRENT_TIMESTAMP, $1, $2)`
          , [dbVersion, targetVersion]);
        }, pool);
      }
    }
  }
};

export const performMigrations = async (pool: Pool, cb: () => any) => {
  try {
    _performMigrations(pool, cb);
  } catch (error) {
    console.log(error);
    console.trace();
  }
};
