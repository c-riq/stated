const Pool = require('pg').Pool
const pool = new Pool({
  user: 'sdf',
  host: 'localhost',
  database: 'dev',
  password: 'sdf',
  port: 5432,
})

const forbiddenChars = s => /;|>|<|"|'|’|\\--/.test(s) // what about = in b64?
const forbiddenStrings = a => a.map(i => forbiddenChars(''+i)).reduce((i,j) => i||j, false)

const createStatement = ({type, version, domain, statement, time, hash_b64, content, content_hash, verification_method}) => (new Promise((resolve, reject)=>{
    if(
      forbiddenStrings([type, version, domain, statement, time, hash_b64, content, content_hash, verification_method])
    ){
      resolve({error: "forbidden characters"})
    }
    try {
      [
        'statement',
        1,
        'rixdata.net',
        'domain: rixdata.net\n' +
          'time: Sun, 02 Oct 2022 17:47:03 GMT\n' +
          'statement: test 19:47',
        'Sun, 02 Oct 2022 17:47:03 GMT',
        '9JDwgxZ5D749w+Gp2RvMp7D+GVJHDEGtn2RpAafomvk=',
        'test 19:47',
        'Rvg94MOylRxShG2cjTQPwzb8K73KtJaK9ktwXc00lrQ=',
        'dns'
      ]
      console.log([type, version, domain, statement, time, hash_b64, content, content_hash, verification_method])
        pool.query(`INSERT INTO statements (type, version, domain, statement, time,
                            hash_b64, content, content_hash, verification_method, latest_verification_ts) 
                      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
                    ON CONFLICT (hash_b64)  DO UPDATE
                      SET latest_verification_ts = CURRENT_TIMESTAMP
                    RETURNING *`,
     [type, version, domain, statement, time, hash_b64, content, content_hash, verification_method], (error, results) => {
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
      if(
        forbiddenStrings([statement_id, version, verifer_domain, verified_domain, name, country, number, authority, method, source])
      ){
        resolve({error: "forbidden characters"})
      }
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


    const getVerifications = (hash_b64) => (new Promise((resolve, reject)=>{
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
                domain
            FROM p2p_nodes v
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
    
    const addNode = (d) => (new Promise((resolve, reject)=>{
      try {
          pool.query(`
            INSERT INTO p2p_nodes (domain, last_seen) VALUES
                ('${d}', CURRENT_TIMESTAMP)
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

    const getJoiningStatements = (hash_b64) => (new Promise((resolve, reject)=>{
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
    const getStatement = (hash) => (new Promise((resolve, reject)=>{
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
    const getOwnStatement = (hash,domain) => (new Promise((resolve, reject)=>{
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
    createStatement,
    getStatements,
    getStatement,
    getOwnStatement,
    createVerification,
    forbiddenChars,
    forbiddenStrings,
    getVerifications,
    getAllVerifications,
    getAllNodes,
    addNode,
    getJoiningStatements
  }
