import React from 'react'
import TextareaAutosize from '@mui/material/TextareaAutosize';
import { Link, useParams } from 'react-router-dom';
import { Buffer } from 'buffer';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';

import { getStatement, getJoiningStatements, getVerifications, getVotes } from '../api.js'
import { statementTypes } from '../constants/statementFormats.js';


const Statement = props => {
    const [joiningStatements, setJoiningStatements] = React.useState([]);
    const [votes, setVotes] = React.useState([]);
    const [statement, setStatement] = React.useState({});
    const [verifications, setVerifications] = React.useState([]);
    const [postsFetched, setPostsFetched] = React.useState(false);

    const hash_b16 = useParams().statementId || '';
    const hash_b64 = Buffer.from(hash_b16, 'hex').toString('base64')


    React.useEffect(() => { if(!postsFetched) {
        getStatement(hash_b64, s => setStatement(s))
        getJoiningStatements(hash_b64, s => setJoiningStatements(s))
        getVotes(hash_b64, v => setVotes(v))
        getVerifications(hash_b64, v => setVerifications(v))
        setPostsFetched(true)
      }
    })
    console.log('verifications',verifications)
    return (
        <div style={{ maxWidth: "90vw", padding: "7%", backgroundColor: "rgba(255,255,255,1)", borderRadius: 8, display:'flex',
         flexDirection:'row', justifyContent: 'center', overflow: 'hidden' }}>
            <div>
            <h3>Statement details</h3>
            <TableContainer component={Paper} sx={{ maxWidth: "90vw"}}>
            <Table sx={{ maxWidth: "100vw", border: 0.5 }} aria-label="simple table">
                <TableHead>
                <TableRow>
                    <TableCell>Key</TableCell>
                    <TableCell align="right">Value</TableCell>
                </TableRow>
                </TableHead>
                <TableBody sx={{ maxWidth: "100vw"}}>
                {Object.keys(statement).map((row,i) => 
                    {if (['statement', 'hash_b64'].includes(row)){
                        return (
                    <TableRow
                    key={i}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 }, maxWidth: "90vw" }}
                    >
                    <TableCell component="th" scope="row" sx={{ maxWidth: "90vw" }}>
                        {row}
                    </TableCell>
                    <TableCell align="right">{row == "statement" ? 
                        (<List>
                            {statement[row].split(/\n/).map((s,i)=>
                              (<ListItem key={i}>{s}</ListItem>
                            ))}
                          </List>) : statement[row]}</TableCell>
                    </TableRow>)
                    }}
                )}
                </TableBody>
            </Table>
            </TableContainer>
            <h3>Independant verification</h3>
            <div>
                <h5>Verifiy statement hash (fingerprint) via terminal</h5>
                <div>
                    <TextareaAutosize style={{width:"100%"}} value={"echo -n \""+ statement.statement +"\"| openssl sha256 -binary | base64 -"} />
                </div>
                <h5>Verify domain owners intention to publish statement</h5>
                <div>
                    <TextareaAutosize style={{width:"100%"}} value={"dig -t txt stated."+statement.domain+" +short | grep " + statement.hash_b64}/>
                </div>
            </div>

            {verifications.length > 0 && (<div>
                <h5>Verifications of {statement.domain}</h5>
                    {verifications.map((v,i)=>(
                        <div key={i}>
                            <Link onClick={()=>setPostsFetched(false)} to={"/statement/"+Buffer.from(v.hash_b64, 'base64').toString('hex')}>
                                {v.verifer_domain}{v.name ? " | " + v.name + " ✅":  ""}
                            </Link>
                        </div>))}
            </div>)}
            
            {joiningStatements.length > 0 && statement && statement.type == statementTypes.statement && (<div><h3>Organisations that joined the statemet</h3>
                {joiningStatements.map((v,i)=>(
                    <div key={i}>
                        <Link key={i} onClick={()=>setPostsFetched(false)} to={"/statement/"+Buffer.from(v.hash_b64, 'base64').toString('hex')}>
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
                        <Link key={i} onClick={()=>setPostsFetched(false)} to={"/statement/"+Buffer.from(v.hash_b64, 'base64').toString('hex')}>
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

