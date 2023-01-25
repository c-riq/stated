const currentCodeVersion = 1

const migrationsFromDBVersionToCurrentCodeVersion = {
    0: {
        sql: `
        DROP TYPE IF EXISTS statement_type CASCADE;
        CREATE TYPE statement_type AS ENUM 
            ('statement', 'dispute statement', 'response',
            'domain verification', 'poll', 'vote', 'trustworthiness rating');
        DROP TYPE IF EXISTS verification_method CASCADE;
        CREATE TYPE verification_method AS ENUM 
            ('api', 'dns');
        DROP TABLE IF EXISTS unverified_statements;
        CREATE TABLE IF NOT EXISTS unverified_statements (
            id SERIAL PRIMARY KEY,
            statement VARCHAR(1500) NOT NULL, 
            hash_b64 VARCHAR(500) UNIQUE NOT NULL,
            source_node_id int,
            received_time TIMESTAMP NOT NULL,
            source_verification_method verification_method,
            verification_retry_count int
        );
        DROP TABLE IF EXISTS statements;
        CREATE TABLE IF NOT EXISTS statements (
            id SERIAL PRIMARY KEY,
            type statement_type NOT NULL,
            domain VARCHAR(100) NOT NULL,
            statement VARCHAR(1500) NOT NULL, 
            proclaimed_publication_time TIMESTAMP,
            hash_b64 VARCHAR(500) UNIQUE NOT NULL,
            referenced_statement VARCHAR(500), -- response, vote, dispute
            tags VARCHAR(1000),
            content VARCHAR(1000) NOT NULL, -- for search
            content_hash VARCHAR(500) NOT NULL, -- for grouping joint statements
            source_node_id int,
            first_verification_time TIMESTAMP,
            latest_verification_time TIMESTAMP,
            verification_method VARCHAR(4), -- dns, api
            derived_entity_created BOOLEAN NOT NULL,
            derived_entity_creation_retry_count int
        );
        DROP TABLE IF EXISTS verifications;
        CREATE TABLE IF NOT EXISTS verifications (
            id SERIAL PRIMARY KEY,
            statement_hash VARCHAR(500) UNIQUE NOT NULL,
            verifier_domain VARCHAR(100) NOT NULL,
            verified_domain VARCHAR(100) NOT NULL,
            name VARCHAR(100) NOT NULL,
            legal_entity_type VARCHAR(100) NOT NULL,
            country VARCHAR(100) NOT NULL,-- ISO 3166 country name
            province VARCHAR(100),
            city VARCHAR(100)
        );
        DROP TABLE IF EXISTS identiy_beliefs_organisations;
        CREATE TABLE IF NOT EXISTS identiy_beliefs_organisations (
            id SERIAL PRIMARY KEY,
            primary_domain1 VARCHAR(100) UNIQUE NOT NULL,
            primary_domain1_confidence DOUBLE PRECISION NOT NULL,
            primary_domain2 VARCHAR(100),
            primary_domain2_confidence DOUBLE PRECISION,
            name1 VARCHAR(100) NOT NULL,
            name1_confidence DOUBLE PRECISION NOT NULL,
            name2 VARCHAR(100),
            name2_confidence DOUBLE PRECISION,
            legal_entity_type1 VARCHAR(100) NOT NULL,
            legal_entity_type1_confidence DOUBLE PRECISION NOT NULL,
            legal_entity_type2 VARCHAR(100),
            legal_entity_type2_confidence DOUBLE PRECISION,
            country1 VARCHAR(100) NOT NULL,
            country1_confidence DOUBLE PRECISION NOT NULL,
            country2 VARCHAR(100),
            country2_confidence DOUBLE PRECISION,
            province1 VARCHAR(100),
            province1_confidence DOUBLE PRECISION,
            province2 VARCHAR(100),
            province2_confidence DOUBLE PRECISION,
            city1 VARCHAR(100),
            city1_confidence DOUBLE PRECISION,
            city2 VARCHAR(100),
            city2_confidence DOUBLE PRECISION
        );
        INSERT INTO identiy_beliefs_organisations (
            primary_domain1, primary_domain1_confidence, name1, name1_confidence, 
            legal_entity_type1, legal_entity_type1_confidence, country1, country1_confidence,
            city1, city1_confidence) 
        VALUES ('rixdata.net', 1.0, 'Rix Data UG (haftungsbeschränkt)', 1.0,
            'limited liability corporation', 1.0, 'DE', 1.0, 
            'Bamberg', 1.0);
        DROP TABLE IF EXISTS identiy_beliefs_people;
        CREATE TABLE IF NOT EXISTS identiy_beliefs_people (
            id SERIAL PRIMARY KEY,
            name1 VARCHAR(100) NOT NULL,
            name1_confidence DOUBLE PRECISION NOT NULL,
            name2 VARCHAR(100),
            name2_confidence DOUBLE PRECISION,
            birth_city VARCHAR(100),
            birth_date VARCHAR(100),
            country1 VARCHAR(100) NOT NULL,
            country1_confidence DOUBLE PRECISION NOT NULL,
            country2 VARCHAR(100),
            country2_confidence DOUBLE PRECISION,
            province1 VARCHAR(100),
            province1_confidence DOUBLE PRECISION,
            province2 VARCHAR(100),
            province2_confidence DOUBLE PRECISION,
            city1 VARCHAR(100),
            city1_confidence DOUBLE PRECISION,
            city2 VARCHAR(100),
            city2_confidence DOUBLE PRECISION,
            current_domain1 VARCHAR(100) NOT NULL,
            current_domain1_confidence DOUBLE PRECISION NOT NULL,
            current_domain2 VARCHAR(100),
            current_domain2_confidence DOUBLE PRECISION
        );
        DROP TABLE IF EXISTS votes;
        CREATE TABLE IF NOT EXISTS votes (
            id SERIAL PRIMARY KEY,
            statement_hash VARCHAR(500) UNIQUE NOT NULL,
            poll_hash VARCHAR(500) NOT NULL,
            option VARCHAR(500) NOT NULL,
            domain VARCHAR(100) NOT NULL,
            qualified BOOLEAN
        );
        DROP TABLE IF EXISTS polls;
        CREATE TABLE IF NOT EXISTS polls (
            id SERIAL PRIMARY KEY,
            statement_hash VARCHAR(500) UNIQUE NOT NULL,
            participants_entity_type VARCHAR(500),
            participants_country VARCHAR(500),
            participants_city VARCHAR(500),
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
        INSERT INTO p2p_nodes (domain) VALUES ('stated.rixdata.net');
        DROP TABLE IF EXISTS migrations;
        CREATE TABLE IF NOT EXISTS migrations (
            id SERIAL PRIMARY KEY,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
            from_version bigint NOT NULL,
            to_version bigint NOT NULL
        );
        INSERT INTO migrations (created_at, from_version, to_version) VALUES (CURRENT_TIMESTAMP, 0, 1);
        --INSERT INTO migrations (created_at, from_version, to_version) VALUES (CURRENT_TIMESTAMP, 0, ${currentCodeVersion});
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
                    AND table_name = 'migrations'
            );`
        let res = await pool.query(sql)
        let dbVersion
        if (res.rows && res.rows[0]){
            if(! (res.rows[0].exists === true)){
                // migrations table does not exist yet
                dbVersion = 0
                sql = migrationsFromDBVersionToCurrentCodeVersion[dbVersion]['sql']
                res = await pool.query(sql)
                console.log('migration from 0 to ' + currentCodeVersion, res)
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
