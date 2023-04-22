import React from 'react'
import TextareaAutosize from '@mui/material/TextareaAutosize';
import { Link, useParams, useLocation } from 'react-router-dom';
import Button from '@mui/material/Button';

import { getStatement, getJoiningStatements, getOrganisationVerifications, 
    getPersonVerifications, getVotes } from '../api.js'
import { statementTypes, parsePDFSigning } from '../constants/statementFormats.js';

import {VerificationGraph} from './VerificationGraph.js'

import {filePath} from './SignPDFForm.js'


const Statement = props => {
    const [joiningStatements, setJoiningStatements] = React.useState([]);
    const [votes, setVotes] = React.useState([]);
    const [statement, setStatement] = React.useState({statement: undefined, 
        type: undefined, domain: undefined, 
        hash_b64: undefined, content: undefined});
    const [organisationVerifications, setOrganisationVerifications] = React.useState([]);
    const [personVerifications, setPersonVerifications] = React.useState([]);
    const [dataFetched, setDataFetched] = React.useState(false);

    const hash_b64 = useParams().statementId || '';


    React.useEffect(() => { if(!dataFetched) {
        getStatement(hash_b64, s => setStatement(s))
        getJoiningStatements(hash_b64, s => setJoiningStatements(s))
        getVotes(hash_b64, v => setVotes(v))
        getOrganisationVerifications(hash_b64, v => setOrganisationVerifications(v))
        getPersonVerifications(hash_b64, v => setPersonVerifications(v))
        setDataFetched(true)
      }
    })
    let location = useLocation()
    React.useEffect(() => {
        setDataFetched(false)
    }, [location])

    let fileURL = ""
    if (statement && (statement.type === statementTypes.signPdf)) {
        const parsedSigning = parsePDFSigning(statement.content)
        fileURL = filePath(parsedSigning.hash_b64)
    }

    console.log('verifications',organisationVerifications, personVerifications)
    return (
        <div style={{ maxWidth: "90vw", backgroundColor: "rgba(255,255,255,1)", borderRadius: 8, display:'flex',
         flexDirection:'row', justifyContent: 'center', overflow: 'hidden' }}>
            <div>
            <h3>Statement details</h3>
            <TextareaAutosize style={{width:"100%", height:((''+statement?.statement).match(/\n/g) ? 
            (40 + ((''+statement?.statement).match(/\n/g)?.length || 0) * 18) + 'px' : "250px"), 
                overflow: "scroll", fontFamily:"Helvetica", fontSize: "15px"}} value={statement?.statement} />

            {statement && (statement.type == statementTypes.poll && (<Link to="/create-statement">
                <Button onClick={()=>{props.voteOnPoll(statement)}} variant='contained' 
                sx={{backgroundColor:"rgba(42,74,103,1)", borderRadius: 8}}>
                    Vote
                </Button>
            </Link>))}
            <VerificationGraph organisationVerifications={organisationVerifications} personVerifications={personVerifications} statement={statement}/>
            {statement.type === statementTypes.signPdf && 
            (<Button href={fileURL} target="blank">View PDF File</Button>)
        }
            <h3>Verify the statement's authenticity</h3>
            <div>
                <h4>1. generate the statement hash</h4>
                <p>The SHA256 hash (in base 64 representation) is a transformed version of the above statement text. 
                    Due to its limited length and small set of characters it can be more easily stored and shared than the full text of the statement. 
                    Running the following command in the mac terminal allows you to independently verify the hash:</p>
                <div>
                    <TextareaAutosize style={{width:"100%", fontSize: "15px", fontFamily:"Helvetica"}} value={"echo -n \""+ statement.statement +"\"| openssl sha256 -binary | base64 | tr -d '=' | tr '/+' '_-' "} />
                </div>
                <h4>2. check the domain owners intention to publish statement via the DNS records</h4>
                <p>Only a owner of a website domain can change the DNS records. If the hash representing the statement was added there, 
                    this implies that the domain owner is also the author of the statement. Running the following command in the mac terminal 
                    allows you to verify that the statement hash is published in the domain's DNS records:</p>
                <div>
                    <TextareaAutosize style={{width:"100%", fontSize: "15px", fontFamily:"Helvetica"}} value={"dig -t txt stated."+statement.domain+" +short | grep " + statement.hash_b64}/>
                </div>
                <p>Or check if the domain owner runs a stated node and verify the intention to publish by running the following command and verifying that the response object also contains the above statement:</p>
                <div>
                    <TextareaAutosize style={{width:"100%", fontSize: "15px", fontFamily:"Helvetica"}} value={"curl 'https://stated." + statement.domain + `/api/statement/' --data '{"hash_b64": "` + statement.hash_b64 + `"}' --header 'Content-Type: application/json'`}/>
                </div>
            </div>

            {organisationVerifications.length > 0 && (<div>
                <h5>Verifications of {statement.domain}</h5>
                    {organisationVerifications.map(({verifier_domain=null, name= null},i)=>(
                        <div key={i}>
                            <Link onClick={()=>setDataFetched(false)} to={"/statement/"+hash_b64}>
                                {verifier_domain}{name ? " | " + name + " ✅":  ""}
                            </Link>
                        </div>))}
            </div>)}
            
            {joiningStatements.length > 0 && statement && statement.type === statementTypes.statement && 
            (<div><h3>Organisations that joined the statemet</h3>
                {joiningStatements.map(({domain, proclaimed_publication_time, name, hash_b64},i)=>(
                    <div key={i}>
                        <Link key={i} onClick={()=>setDataFetched(false)} to={"/statement/"+hash_b64}>
                            {domain + " | " + (new Date(proclaimed_publication_time).toUTCString())}{name ? " | " + name + " ✅":  ""}
                        </Link>
                    </div>
                    )
                )}
            </div>
            )}

            
            {votes.length > 0 && (<div><h3>Qualified votes</h3>
                {votes.map(({proclaimed_publication_time, domain, option, hash_b64, name},i)=>(
                    <div key={i}>
                        <Link key={i} onClick={()=>setDataFetched(false)} to={"/statement/"+hash_b64}>
                            {option + " | " + domain + " | " + (new Date(parseInt(proclaimed_publication_time)).toUTCString())}{name ? " | " + name + " ✅":  ""}
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

