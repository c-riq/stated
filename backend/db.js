const Pool = require('pg').Pool
const pool = new Pool({
  user: 'sdf',
  host: 'localhost',
  database: 'dev',
  password: 'sdf',
  port: 5432,
})

const forbiddenChars = s => /;|>|<|"|'|’|\/|\\|=[\s\S]/.test(s) // string ending in "=" for b64
const forbiddenStrings = a => a.map(i => forbiddenChars(''+i)).reduce((i,j) => i||j, false)

const s = (f) => { 
  // sql&xss satitize all input to exported functions, checking all string values of a single input object
  return (o) => {
    if (typeof o == 'undefined') {
      return f()
    }
    if (forbiddenStrings(Object.values(o))) {
      return {error: 'invalid characters'}
    } else {
      return f(o)
    }
  }
}

const createStatement = ({type, version, domain, statement, time, hash_b64, content, content_hash, verification_method, source_node_id}) => (new Promise((resolve, reject)=>{
    try {
      console.log([type, version, domain, statement, time, hash_b64, content, content_hash, verification_method, source_node_id])
      //TODO add source_node_id if not null
        pool.query(`INSERT INTO statements (type, version, domain, statement, time,
                            hash_b64, content, content_hash, verification_method, source_node_id, latest_verification_ts) 
                      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
                    ON CONFLICT (hash_b64) DO UPDATE
                      SET latest_verification_ts = CURRENT_TIMESTAMP
                    RETURNING *`,
     [type, version, domain, statement, time, hash_b64, content, content_hash, verification_method, source_node_id], (error, results) => {
        if (error) {
            console.log(error)
            resolve({error})
        } else {
            resolve({inserted: results.rows[0]})
        }
      })
    } catch (error){
        resolve({error})
    }
  }))

  const getStatements = ({minId}) => (new Promise((resolve, reject)=>{
      try {
          if (forbiddenChars(minId)) {
            throw 'forbidden characters'
          }
          pool.query(`
            WITH reposts as(
                SELECT 
                    content as _content, 
                    count(distinct domain) as repost_count, 
                    first_value(min(id)) over(partition by content order by min(created_at) asc) as first_id
                FROM statements 
                WHERE type = 'statement'
                ${minId ? 'AND id > ' + minId : ''}
                GROUP BY 1
                ORDER BY repost_count DESC
                LIMIT 20
            )
            SELECT 
                s.id,
                s.domain,
                v.name,
                s.statement,
                r.repost_count,
                s.time,
                s.created_at,
                s.hash_b64,
                s.content,
                s.content_hash
            FROM statements s
                JOIN reposts r
                    ON id=first_id
                LEFT JOIN verifications v 
                    ON s.domain=v.verified_domain 
                    AND v.verifer_domain='rixdata.net';
            `, (error, results) => {
          if (error) {
              console.log(error)
              resolve({error})
          } else {
              resolve(results)
          }
        })
      } catch (error){
          resolve({error})
      }
    }))

const createVerification = ({statement_id, version, verifer_domain, verified_domain, name, country, number, authority, method, source}) => (new Promise((resolve, reject)=>{
      try {
          pool.query('INSERT INTO verifications (statement_id, version, verifer_domain, verified_domain, '+
      'name, country, number, authority, method, source) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
       [statement_id, version, verifer_domain, verified_domain, name, country, number, authority, method, source], (error, results) => {
          if (error) {
              console.log(error)
              resolve({error})
          } else {
              resolve(`Statement inserted with ID: ${results.rows[0].id}`)
          }
        })
      } catch (error){
          resolve({error})
      }
    }))


    const getVerifications = ({hash_b64}) => (new Promise((resolve, reject)=>{
      try {
          pool.query(`
            WITH domains AS (
              SELECT domain 
              FROM statements
              WHERE hash_b64='${hash_b64}'
              LIMIT 1
            )
            SELECT 
                v.*,
                s.*
            FROM verifications v
              JOIN statements s ON v.statement_id=s.id
            WHERE v.verified_domain IN (SELECT domain FROM domains);
            `, (error, results) => {
          if (error) {
              console.log(error)
              resolve({error})
          } else {
              resolve(results)
          }
        })
      } catch (error){
          resolve({error})
      }
    }));

    const getAllVerifications = () => (new Promise((resolve, reject)=>{
      try {
          pool.query(`
            SELECT 
                s.*
            FROM verifications v
              JOIN statements s ON v.statement_id=s.id
            `, (error, results) => {
          if (error) {
              console.log(error)
              resolve({error})
          } else {
              resolve(results)
          }
        })
      } catch (error){
          resolve({error})
      }
    }));
    
    const getAllNodes = () => (new Promise((resolve, reject)=>{
      try {
          pool.query(`
            SELECT 
                domain,
                id,
                last_received_statement_id
            FROM p2p_nodes;
            `, (error, results) => {
          if (error) {
              console.log(error)
              resolve({error})
          } else {
              resolve(results)
          }
        })
      } catch (error){
          resolve({error})
      }
    }));
    
    const addNode = ({domain}) => (new Promise((resolve, reject)=>{
      try {
          pool.query(`
            INSERT INTO p2p_nodes (domain, last_seen) VALUES
                ('${domain}', CURRENT_TIMESTAMP)
            ON CONFLICT (domain) DO UPDATE
              SET last_seen = CURRENT_TIMESTAMP
            RETURNING *
            `, (error, results) => {
          if (error) {
              console.log(error)
              resolve({error})
          } else {
              resolve({inserted: results.rows[0]})
          }
        })
      } catch (error){
          resolve({error})
      }
    }));

    const getJoiningStatements = ({hash_b64}) => (new Promise((resolve, reject)=>{
      try {
          pool.query(`
            WITH content_hashes AS(
              SELECT content_hash
              FROM statements
              WHERE hash_b64='${hash_b64}'
            )
            SELECT 
                s.*,
                v.name
            FROM statements s        
              LEFT JOIN verifications v 
                ON s.domain=v.verified_domain 
                AND v.verifer_domain='rixdata.net'
            WHERE content_hash IN (SELECT content_hash FROM content_hashes)
            AND hash_b64 <>'${hash_b64}';
            `, (error, results) => {
          if (error) {
              console.log(error)
              resolve({error})
          } else {
              resolve(results)
          }
        })
      } catch (error){
          resolve({error})
      }
    }))
    const getStatement = ({hash}) => (new Promise((resolve, reject)=>{
      try {
          pool.query(`
            SELECT 
                s.*,
                v.name
            FROM statements s        
              LEFT JOIN verifications v 
                ON s.domain=v.verified_domain 
                AND v.verifer_domain='rixdata.net'
            WHERE hash_b64='${hash}';
            `, (error, results) => {
          if (error) {
              console.log(error)
              resolve({error})
          } else {
              resolve(results)
          }
        })
      } catch (error){
          resolve({error})
      }
    }))
    const setLastReceivedStatementId = ({domain, id}) => (new Promise((resolve, reject) =>{
        console.log('setLastReceivedStatementId', domain, id)
        try {
          pool.query(`
            UPDATE p2p_nodes
            SET last_received_statement_id = ${id}
            WHERE domain = '${domain}'
              AND (last_received_statement_id IS NULL
                OR
                last_received_statement_id < ${id}
              );
            `, (error, results) => {
          if (error) {
              console.log(error)
              resolve({error})
          } else {
              resolve(results)
          }
        })
      } catch (error){
          resolve({error})
      }
    }))
    const statementExists = ({hash_b64}) => (new Promise((resolve, reject) =>{
        try {
          pool.query(`
            SELECT 1 FROM statements WHERE hash_b64 = '${hash_b64}' LIMIT 1;
            `, (error, results) => {
          
          //console.log('statementExists', hash_b64, results, error)
          if (error) {
              console.log(error)
              resolve({error})
          } else {
              resolve(results)
          }
        })
      } catch (error){
          resolve({error})
      }
    }))

    const getOwnStatement = ({hash,domain}) => (new Promise((resolve, reject)=>{
      try {
          pool.query(`
            SELECT 
              *
            FROM statements s
            WHERE hash_b64='${hash}'
              ${domain ? "AND domain='" + domain + "'": ""}
            ;
            `, (error, results) => {
          if (error) {
              console.log(error)
              resolve({error})
          } else {
              resolve(results)
          }
        })
      } catch (error){
          resolve({error})
      }
    }))

  module.exports = {
    createStatement: s(createStatement),
    getStatements: s(getStatements),
    getStatement: s(getStatement),
    getOwnStatement: s(getOwnStatement),
    createVerification: s(createVerification),
    forbiddenChars: s(forbiddenChars),
    forbiddenStrings: s(forbiddenStrings),
    getVerifications: s(getVerifications),
    getAllVerifications: s(getAllVerifications),
    getAllNodes: s(getAllNodes),
    addNode: s(addNode),
    getJoiningStatements: s(getJoiningStatements),
    setLastReceivedStatementId: s(setLastReceivedStatementId),
    statementExists: s(statementExists)
  }
