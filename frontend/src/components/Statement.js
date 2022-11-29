import React from 'react'
import TextareaAutosize from '@mui/material/TextareaAutosize';
import { Link, useParams, useLocation } from 'react-router-dom';
import { Buffer } from 'buffer';

import { getStatement, getJoiningStatements, getVerifications, getVotes } from '../api.js'
import { statementTypes } from '../constants/statementFormats.js';


const Statement = props => {
    const [joiningStatements, setJoiningStatements] = React.useState([]);
    const [votes, setVotes] = React.useState([]);
    const [statement, setStatement] = React.useState({});
    const [verifications, setVerifications] = React.useState([]);
    const [dataFetched, setDataFetched] = React.useState(false);

    const hash_b16 = useParams().statementId || '';
    const hash_b64 = Buffer.from(hash_b16, 'hex').toString('base64')


    React.useEffect(() => { if(!dataFetched) {
        getStatement(hash_b64, s => setStatement(s))
        getJoiningStatements(hash_b64, s => setJoiningStatements(s))
        getVotes(hash_b64, v => setVotes(v))
        getVerifications(hash_b64, v => setVerifications(v))
        setDataFetched(true)
      }
    })
    let location = useLocation()
    React.useEffect(() => {
        setDataFetched(false)
    }, [location])

    console.log('verifications',verifications)
    return (
        <div style={{ maxWidth: "90vw", backgroundColor: "rgba(255,255,255,1)", borderRadius: 8, display:'flex',
         flexDirection:'row', justifyContent: 'center', overflow: 'hidden' }}>
            <div>
            <h3>Statement details</h3>
            <TextareaAutosize style={{width:"100%", height:"250px", overflowX: "scroll", whiteSpace: "nowrap", fontFamily:"Arial"}} value={statement && statement.statement} />

            <h3>Verify the statement's authenticity</h3>
            <div>
                <h5>1. generate the statement hash</h5>
                <p>The SHA256 hash (in base 64 representation) is a transformed version of the above statement text. 
                    Due to its limited length and small set of characters it can be more easily stored and shared than the full text of the statement. 
                    Running the following command in the mac terminal allows you to independently verify the hash:</p>
                <div>
                    <TextareaAutosize style={{width:"100%"}} value={"echo -n \""+ statement.statement +"\"| openssl sha256 -binary | base64 -"} />
                </div>
                <h5>2. check the domain owners intention to publish statement via the DNS records</h5>
                <p>Only a owner of a website domain can change the DNS records. If the hash representing the statement was added there, 
                    this implies that the domain owner is also the author of the statement. Running the following command in the mac terminal 
                    allows you to verify that the statement hash is published in the domain's DNS records:</p>
                <div>
                    <TextareaAutosize style={{width:"100%"}} value={"dig -t txt stated."+statement.domain+" +short | grep " + statement.hash_b64}/>
                </div>
            </div>

            {verifications.length > 0 && (<div>
                <h5>Verifications of {statement.domain}</h5>
                    {verifications.map((v,i)=>(
                        <div key={i}>
                            <Link onClick={()=>setDataFetched(false)} to={"/statement/"+Buffer.from(v.hash_b64, 'base64').toString('hex')}>
                                {v.verifer_domain}{v.name ? " | " + v.name + " ✅":  ""}
                            </Link>
                        </div>))}
            </div>)}
            
            {joiningStatements.length > 0 && statement && statement.type == statementTypes.statement && 
            (<div><h3>Organisations that joined the statemet</h3>
                {joiningStatements.map((v,i)=>(
                    <div key={i}>
                        <Link key={i} onClick={()=>setDataFetched(false)} to={"/statement/"+Buffer.from(v.hash_b64, 'base64').toString('hex')}>
                            {v.domain + " | " + (new Date(parseInt(v.time)).toUTCString())}{v.name ? " | " + v.name + " ✅":  ""}
                        </Link>
                    </div>
                    )
                )}
            </div>
            )}

            
            {votes.length > 0 && (<div><h3>Qualified votes</h3>
                {votes.map((v,i)=>(
                    <div key={i}>
                        <Link key={i} onClick={()=>setDataFetched(false)} to={"/statement/"+Buffer.from(v.hash_b64, 'base64').toString('hex')}>
                            {v.option + " | " + v.domain + " | " + (new Date(parseInt(v.time)).toUTCString())}{v.name ? " | " + v.name + " ✅":  ""}
                        </Link>
                    </div>
                    )
                )}
            </div>
            )}

            </div>
        </div>
    )
}


export default Statement

