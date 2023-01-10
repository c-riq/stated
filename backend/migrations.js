const currentCodeVersion = 4

const migrationsFromDBVersionToCurrentCodeVersion = {
    0: {
        sql: `
        DROP TABLE IF EXISTS statements;
        CREATE TABLE IF NOT EXISTS statements (
            id SERIAL PRIMARY KEY,
            type VARCHAR(100) NOT NULL, -- statement | domain_verification
            version INT NOT NULL, 
            domain VARCHAR(100) NOT NULL,
            statement VARCHAR(1500) NOT NULL, 
            proclaimed_publication_time TIMESTAMP,
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
            qualified BOOLEAN
        );
        DROP TABLE IF EXISTS polls;
        CREATE TABLE IF NOT EXISTS polls (
            id SERIAL PRIMARY KEY,
            statement_hash VARCHAR(500) UNIQUE NOT NULL,
            participants_entity_type VARCHAR(500) NOT NULL,
            participants_country VARCHAR(500) NOT NULL,
            participants_city VARCHAR(500) NOT NULL,
            deadline timestamp NOT NULL
        );
        DROP TABLE IF EXISTS disputes;
        CREATE TABLE IF NOT EXISTS disputes (
            id SERIAL PRIMARY KEY,
            statement_hash VARCHAR(500) UNIQUE NOT NULL,
            disputed_statement_hash VARCHAR(500) NOT NULL,
            domain VARCHAR(500) NOT NULL,
            p2p_node_id int
        );
        DROP TABLE IF EXISTS p2p_nodes;
        CREATE TABLE IF NOT EXISTS p2p_nodes (
            id SERIAL PRIMARY KEY,
            domain VARCHAR(150) UNIQUE NOT NULL,
            ip VARCHAR(150),
            first_seen timestamp,
            last_seen timestamp,
            reputation real,
            last_received_statement_id bigint,
            certificate_authority VARCHAR(100),
            fingerprint VARCHAR(100)
        );
        DROP TABLE IF EXISTS migrations;
        CREATE TABLE IF NOT EXISTS migrations (
            id SERIAL PRIMARY KEY,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
            from_version bigint NOT NULL,
            to_version bigint NOT NULL
        );
        CREATE TABLE IF NOT EXISTS wikidata_org_domains (
            type_id TEXT,
            english_label TEXT,
            official_website TEXT,
            lat DOUBLE PRECISION,
            lon DOUBLE PRECISION,
            country_id TEXT,
            city_id TEXT,
            employees DOUBLE PRECISION,
            twitter_id TEXT,
            twitter_name TEXT,
            crunchbase_id TEXT,
            facebook_id TEXT,
            linkedin_id TEXT,
            grid_id TEXT           
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
    },
    2: {
        sql: `
        ALTER TABLE p2p_nodes
          ADD certificate_authority VARCHAR(100),
          ADD fingerprint VARCHAR(100);
        `
    },
    3: {
        sql: `
        ALTER TABLE p2p_nodes
          ADD first_seen TIMESTAMP;
        ALTER TABLE statements
          DROP created_at,
          DROP updated_at;  
        ALTER TABLE votes
            DROP name;
        ALTER TABLE statements
          ADD proclaimed_publication_time TIMESTAMP,
          DROP time;
        CREATE TABLE IF NOT EXISTS wikidata_org_domains (
              type_id TEXT,
              english_label TEXT,
              official_website TEXT,
              lat DOUBLE PRECISION,
              lon DOUBLE PRECISION,
              country_id TEXT,
              city_id TEXT,
              employees DOUBLE PRECISION,
              twitter_id TEXT,
              twitter_name TEXT,
              crunchbase_id TEXT,
              facebook_id TEXT,
              linkedin_id TEXT,
              grid_id TEXT           
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
                if (res.error){
                    console.log('res error', res.error)
                    console.trace()
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
        console.trace()
    }
}
