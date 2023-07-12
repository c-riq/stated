const cp = require("child_process");

const currentVersion = 3

const v1 = cp.spawnSync("node", ["../../../backend/index.js"], {
  env: {
    ...process.env,
    TEST: "true",
    POSTGRES_PORT: "5441",
    POSTGRES_HOST: "localhost",
    API_KEY: "XXX",
    DOMAIN: "stated_1:7001",
    MIGRATION_TEST_VERSION: '' + currentVersion,
    DELETE_DATA: "true",
    PORT: "7001",
  },
  timeout: 10 * 1000,
  encoding: 'utf-8'
});

console.log(v1.stdout, v1.stderr, v1.error)

const { Client } = require('pg')
const config = {
    user: "sdf",
    host: "localhost",
    database: "stated",
    password: "sdf",
    port: 5441,
}
const client = new Client(config);

(async () => {
    await client.connect()
    await new Promise((resolve, reject) => setTimeout(resolve, 10 * 1000))
    
    const res = await client.query('SELECT MAX(to_version) max_version FROM migrations')
    console.log(res.rows[0].max_version)
    if(('' + res.rows[0].max_version) !== '' + currentVersion) {
        throw new Error('Migration failed')
    }
    await client.end()
})();
