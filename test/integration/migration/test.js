const cp = require("child_process");

const fs = require("fs");

var sampleDataCurrent = fs
  .readFileSync(__dirname + "/sample_data_current.sql", "utf8")
  .toString();
var sampleDataV1 = fs
  .readFileSync(__dirname + "/sample_data_v1.sql", "utf8")
  .toString();

// Migration
let migrationResultDBDump = ''
let targetSchemaDBDump = ''

const currentVersion = 4

const { Client } = require('pg')
const config_1 = {
    user: "sdf",
    host: "localhost",
    database: "postgres",
    password: "sdf",
    port: 5451,
}
let client_1 = new Client(config_1);

(async () => {
    await client_1.connect()
    let res = await client_1.query('DROP DATABASE stated;')
    console.log(res)
    res = await client_1.query('CREATE DATABASE stated;')
    console.log(res)
    await client_1.end()

    client_1 = new Client({...config_1, database: 'stated'});
    await client_1.connect()

    let server = cp.spawn("node", ["../../../backend/index.js"], {
      env: {
        ...process.env,
        TEST: "true",
        POSTGRES_PORT: "5451",
        POSTGRES_HOST: "localhost",
        API_KEY: "XXX",
        DOMAIN: "stated_1:7001",
        MIGRATION_TEST_VERSION: '' + 1,
        DELETE_DATA: "true",
        PORT: "7001",
      },
      timeout: 10 * 1000,
    });

    server.on("error", (err) => {
      console.log(err);
    });
    server.stderr.on("data", (data) => {
      console.log(data.toString());
    });

    await new Promise((resolve, reject) => setTimeout(resolve, 5 * 1000))

    server.kill()

    res = await client_1.query(sampleDataV1)
    console.log('insert sampleDataV1 response ', res)

    server = cp.spawn("node", ["../../../backend/index.js"], {
      env: {
        ...process.env,
        TEST: "true",
        POSTGRES_PORT: "5451",
        POSTGRES_HOST: "localhost",
        API_KEY: "XXX",
        DOMAIN: "stated_1:7001",
        MIGRATION_TEST_VERSION: '' + currentVersion,
        DELETE_DATA: "false",
        PORT: "7001",
      },
      timeout: 10 * 1000,
    });

    server.on("error", (err) => {
      console.log(err);
    });
    server.stderr.on("data", (data) => {
      console.log(data.toString());
    });

    await new Promise((resolve, reject) => setTimeout(resolve, 10 * 1000))
    
    res = await client_1.query('SELECT MAX(to_version) max_version FROM migrations')
    console.log('migrated to: ' + res.rows[0].max_version)
    if(('' + res.rows[0].max_version) !== '' + currentVersion) {
        throw new Error('Migration failed')
    }
    await client_1.end()
    try {
      const pgdump = cp.spawn(`PGPASSWORD=sdf pg_dump -h localhost -p 5451 -U sdf -d stated --exclude-table=migrations`,[], {shell: true})
      let sql = ''
      pgdump.on('error', (err) => { console.log(err) })
      pgdump.stderr.on('data', (data) => { console.log(data.toString()) })
      pgdump.stdout.on('data', (data) => {
        sql += data.toString()
      });
      pgdump.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
        sql = sql.replace(/SELECT pg_catalog.setval\('public.migrations_id_seq', \d+, true\);/g, '')
        fs.writeFileSync(__dirname + "/actual.sql", sql);
        migrationResultDBDump = sql
      });
    } catch (e) {
      console.log(e)
    }
})();

// Target schema

var targetSchema = fs
  .readFileSync(__dirname + "/../../../backend/database/schema.sql", "utf8")
  .toString();

const config_2 = {
  user: "sdf",
  host: "localhost",
  database: "postgres",
  password: "sdf",
  port: 5452,
}
let client_2 = new Client(config_2);

(async () => {
    await client_2.connect()
    let res = await client_2.query('DROP DATABASE stated;')
    console.log(res)
    res = await client_2.query('CREATE DATABASE stated;')
    console.log(res)
    await client_2.end()

    client_2 = new Client({...config_2, database: 'stated'});
    await client_2.connect()
    res = await client_2.query(targetSchema)
    console.log(res)
    res = await client_2.query(sampleDataCurrent)
    console.log('sampleDataCurrent response', res)
    await client_2.end()
    try {
      const pgdump = cp.spawn(`PGPASSWORD=sdf pg_dump -h localhost -p 5452 -U sdf -d stated --exclude-table=migrations`,[], {shell: true})
      let sql = ''
      pgdump.on('error', (err) => { console.log(err) })
      pgdump.stderr.on('data', (data) => { console.log(data.toString()) })
      pgdump.stdout.on('data', (data) => {
        sql += data.toString()
      });
      pgdump.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
        sql = sql.replace(/SELECT pg_catalog.setval\('public.migrations_id_seq', \d+, true\);/g, '')
        fs.writeFileSync(__dirname + "/expected.sql", sql);
        targetSchemaDBDump = sql
      });
    } catch (e) {
      console.log(e)
    }
})();

const interval = setInterval(() => {
  if (migrationResultDBDump.length > 1000 && targetSchemaDBDump.length > 1000) {
    clearInterval(interval);
    if (migrationResultDBDump !== targetSchemaDBDump) {
      console.log("Error: Migration result does not match target schema");
      process.exit(1);
    } else {
      console.log("Success: Migration result matches target schema");
      process.exit(0);
    }
  }
}, 1000);
