import fs from "fs";

import { backup } from "./backup";

import { transaction } from "./transaction";

import { Pool } from "pg";

const migration1 = fs
  .readFileSync(__dirname + "/sql/migration_1.sql", "utf8")
  .toString();
const migration2 = fs
  .readFileSync(__dirname + "/sql/migration_2.sql", "utf8")
  .toString();
const migration3 = fs
  .readFileSync(__dirname + "/sql/migration_3.sql", "utf8")
  .toString();
const migration4 = fs
  .readFileSync(__dirname + "/sql/migration_4.sql", "utf8")
  .toString();
const migration5 = fs
  .readFileSync(__dirname + "/sql/migration_5.sql", "utf8")
  .toString();
const migration6 = fs
  .readFileSync(__dirname + "/sql/migration_6.sql", "utf8")
  .toString();
const migration7 = fs
  .readFileSync(__dirname + "/sql/migration_7.sql", "utf8")
  .toString();
const migration8 = fs
  .readFileSync(__dirname + "/sql/migration_8.sql", "utf8")
  .toString();
const migration9 = fs
  .readFileSync(__dirname + "/sql/migration_9.sql", "utf8")
  .toString();
const migration10 = fs
  .readFileSync(__dirname + "/sql/migration_10.sql", "utf8")
  .toString();
const migration11 = fs
  .readFileSync(__dirname + "/sql/migration_11.sql", "utf8")
  .toString();
const migration12 = fs
  .readFileSync(__dirname + "/sql/migration_12.sql", "utf8")
  .toString();
const migration13 = fs
  .readFileSync(__dirname + "/sql/migration_13.sql", "utf8")
  .toString();
const migration14 = fs
  .readFileSync(__dirname + "/sql/migration_14.sql", "utf8")
  .toString();
const migration15 = fs
  .readFileSync(__dirname + "/sql/migration_15.sql", "utf8")
  .toString();
const migration16 = fs
  .readFileSync(__dirname + "/sql/migration_16.sql", "utf8")
  .toString();

const migrateToVersion = {
    1: { sql: migration1 },
    2: { sql: migration2 },
    3: { sql: migration3 },
    4: { sql: migration4 },
    5: { sql: migration5 },
    6: { sql: migration6 },
    7: { sql: migration7 },
    8: { sql: migration8 },
    9: { sql: migration9 },
    10: { sql: migration10 },
    11: { sql: migration11 },
    12: { sql: migration12 },
    13: { sql: migration13 },
    14: { sql: migration14 },
    15: { sql: migration15 },
    16: { sql: migration16 },
};

const currentCodeVersion = 16;
const test = process.env.TEST || false;
const _currentCodeVersion = test && parseInt(process.env.MIGRATION_TEST_VERSION ?? "") || currentCodeVersion;

const deleteData = process.env.TEST && (process.env.DELETE_DATA === "true");
let dataDeleted = false;

const testMigrationTableExistence = (pool: Pool) =>
  new Promise((resolve, reject) => {
    try {
      const sql = `
  SELECT EXISTS (
      SELECT 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
          AND table_name = 'migrations'
  );`;
      pool.query(sql, (error, res) => {
        try {
          if (error) {
            return reject(error);
          } else {
            if (res.rows && res.rows[0]) {
              if (res.rows[0].exists === false) {
                return resolve(false);
              }
              if (res.rows[0].exists === true) {
                return resolve(true);
              }
            } else {
              return reject(
                Error("Could not query stated database for migrations table.")
              );
            }
          }
        } catch (error) {
          console.log(error);
          return reject(error);
        }
      });
    } catch (error) {
      console.log(error);
      return reject(error);
    }
  });

const getLatestMigrationVersion = (pool: Pool) =>
  new Promise((resolve, reject) => {
    const sql = `SELECT MAX(to_version) max_version FROM migrations`;
    pool.query(sql, (error, res) => {
      if (error) {
        reject(error);
      } else {
        const maxVersion = res.rows[0].max_version;
        if (/^[0-9]+$/.test("" + maxVersion)) {
          // positive integer
          resolve(maxVersion);
        }
      }
    });
  });

export const performMigrations = async (pool: Pool, cb: () => any) => {
  try {
    if (deleteData && !dataDeleted) {
      console.log("deleting data");
      await pool.query(migrateToVersion[1]['sql']);
      dataDeleted = true
    }
    const migrationsTableExists = await testMigrationTableExistence(pool);
    if (!migrationsTableExists) {
      const backupResult = await backup();
      transaction(async (client) => {
        const targetVersion = 1;
        const sql = migrateToVersion[targetVersion]["sql"];
        console.log("migrating from 0 to version " + targetVersion);
        const res = await client.query(
          sql +
            `;INSERT INTO migrations (created_at, from_version, to_version) VALUES (CURRENT_TIMESTAMP, 0, ${targetVersion})`,
        );
      }, pool);
    } else {
      const maxVersion = await getLatestMigrationVersion(pool);
      if (maxVersion === "" + _currentCodeVersion) {
        cb();
      } else {
        const dbVersion = parseInt("" + maxVersion);
        const targetVersion = dbVersion + 1;
        if (targetVersion > 1 && migrateToVersion[targetVersion as keyof typeof migrateToVersion]) {
          await backup();
          await transaction(
            (client) =>
              new Promise((resolve, reject) => {
                const sql = migrateToVersion[targetVersion as keyof typeof migrateToVersion]["sql"];
                console.log(
                  `migrating from ${dbVersion} to version ${targetVersion}`
                );
                const res = client.query(sql, (error, res) => {
                  if (error) {
                    reject(error);
                    return client.release();
                  } else {
                    client.query(
                      `INSERT INTO migrations (created_at, from_version, to_version) VALUES (CURRENT_TIMESTAMP, $1, $2)`,
                      [dbVersion, targetVersion],
                      (error, res) => {
                        try {
                          if (error) {
                            console.log(error);
                            reject(error);
                            return client.release();
                          } else {
                            resolve(res);
                            return client.release();
                          }
                        } catch (error) {
                          console.log(error);
                          reject(error);
                        }
                      }
                    );
                  }
                });
              }),
            pool
          );
        }
      }
    }
  } catch (error) {
    console.log(error);
    console.trace();
  }
};
