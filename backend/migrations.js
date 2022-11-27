const currentCodeVersion = 2

const migrationsFromDBVersionToCurrentCodeVersion = {
    0: {
        sql: `
        DROP TABLE IF EXISTS statements;
        CREATE TABLE IF NOT EXISTS statements (
            id SERIAL PRIMARY KEY,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
            type VARCHAR(100) NOT NULL, -- statement | domain_verification
            version INT NOT NULL, 
            domain VARCHAR(100) NOT NULL,
            statement VARCHAR(1500) NOT NULL, 
            time VARCHAR(100) NOT NULL,
            hash_b64 VARCHAR(500) UNIQUE NOT NULL,
            referenced_statement VARCHAR(500), -- response, vote, dispute
            tags VARCHAR(1000),
            content VARCHAR(1000) NOT NULL, -- for search
            content_hash VARCHAR(500) NOT NULL, -- for grouping joint statements
            source_node_id int,
            first_verification_ts TIMESTAMP,
            latest_verification_ts TIMESTAMP,
            verification_method VARCHAR(4) -- dns, api
        );
        DROP TABLE IF EXISTS verifications;
        CREATE TABLE IF NOT EXISTS verifications (
            id SERIAL PRIMARY KEY,
            statement_hash VARCHAR(500) UNIQUE NOT NULL,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
            version INT NOT NULL, 
            verifer_domain VARCHAR(100) NOT NULL,
            verified_domain VARCHAR(100) NOT NULL,
            name VARCHAR(100) NOT NULL,
            country VARCHAR(100) NOT NULL,-- ISO 3166 country name
            province VARCHAR(100),
            city VARCHAR(100)
        );
        DROP TABLE IF EXISTS votes;
        CREATE TABLE IF NOT EXISTS votes (
            id SERIAL PRIMARY KEY,
            statement_hash VARCHAR(500) UNIQUE NOT NULL,
            poll_hash VARCHAR(500) NOT NULL,
            option VARCHAR(500) NOT NULL,
            domain VARCHAR(100) NOT NULL,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
            name VARCHAR(100),
            qualified BOOLEAN
        );
        DROP TABLE IF EXISTS p2p_nodes;
        CREATE TABLE IF NOT EXISTS p2p_nodes (
            id SERIAL PRIMARY KEY,
            domain VARCHAR(150) UNIQUE NOT NULL,
            ip VARCHAR(150),
            last_seen timestamp,
            reputation real,
            last_received_statement_id bigint
        );
        DROP TABLE IF EXISTS migrations;
        CREATE TABLE IF NOT EXISTS migrations (
            id SERIAL PRIMARY KEY,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
            from_version bigint NOT NULL,
            to_version bigint NOT NULL
        );
        `
    },
    1: {
        sql: `
        DROP TABLE IF EXISTS votes;
        CREATE TABLE IF NOT EXISTS votes (
            id SERIAL PRIMARY KEY,
            statement_hash VARCHAR(500) UNIQUE NOT NULL,
            poll_hash VARCHAR(500) NOT NULL,
            option VARCHAR(500) NOT NULL,
            domain VARCHAR(100) NOT NULL,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
            name VARCHAR(100),
            qualified BOOLEAN
        );
        `
    }
}


export const performMigrations = async (pool, cb) => {
    try {
        let sql = `
            SELECT EXISTS (
                SELECT 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                    AND table_name   = 'migrations'
            );`
        let res = await pool.query(sql)
        let dbVersion
        if (res.rows && res.rows[0]){
            if(! (res.rows[0].exists === true)){
                dbVersion = 0
                sql = migrationsFromDBVersionToCurrentCodeVersion[dbVersion]['sql']
                res = await pool.query(sql)
                console.log('migration from 1 to ' + currentCodeVersion, res)
                if(res.error){
                    return
                } else {
                    sql = `INSERT INTO migrations (created_at, from_version, to_version) VALUES (CURRENT_TIMESTAMP, $1, $2)`
                    res = await pool.query(sql, [dbVersion, currentCodeVersion])
                    if(res.error) {
                        console.log(res.error)
                        return
                    }
                }

            } else {
                sql = `SELECT MAX(to_version) max_version FROM migrations`
                res = await pool.query(sql)
                console.log(res)
                if (res.error){
                    console.log('res error', res.error)
                } else {
                    const maxVersion = res.rows[0].max_version
                    if (maxVersion === '' + currentCodeVersion) {
                        cb()
                    } else {
                        dbVersion = parseInt(maxVersion)
                        if(migrationsFromDBVersionToCurrentCodeVersion[dbVersion]){
                            sql = migrationsFromDBVersionToCurrentCodeVersion[dbVersion]['sql']
                            res = await pool.query(sql)
                            console.log('migration from ' + dbVersion + ' to ' + currentCodeVersion, res)
                            if(res.error){
                                return
                            } else {
                                sql = `INSERT INTO migrations (created_at, from_version, to_version) VALUES (CURRENT_TIMESTAMP, $1, $2)`
                                res = await pool.query(sql, [dbVersion, currentCodeVersion])
                                if(res.error) {
                                    console.log(res.error)
                                    return
                                }
                            }
                        }
                    }
                }
            }
        }
      } catch (error) {
        console.log(error)
    }
}
