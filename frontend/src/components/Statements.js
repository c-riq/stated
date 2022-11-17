import { flexbox } from '@mui/system';
import React from 'react'
import PlusOneIcon from '@mui/icons-material/PlusOne';
import PollIcon from '@mui/icons-material/Poll';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';

import { b64ToHex } from '../utils/hash.js';

const { statementTypes, pollRegex, statementRegex, contentRegex } = require('../constants/statementFormats.js')

const Statements = props => {
    const { lt850px } = props
    return (
        <div style={lt850px ? {marginBottom : "10%" } : { padding: "7%",margin: "2%", borderRadius: 8 }}>
            <div style={lt850px ? {width: "100vw"} : { width: "70vw", maxWidth: "900px" }}>
            <div style={{...{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}, ...(lt850px ? {margin:"4%"}:{})}}>
                <h3>Statements</h3> {props.children}</div>
                <div style ={(lt850px ? {} : {minHeight: '50vh'})}>
                    {props.posts && props.posts.length === 0 && (<div style={{marginTop: '50px'}}>no statements found.</div>)}
                    {props.posts && props.posts.length > 0 && props.posts.map((p,i) => {
                        if (p.type == statementTypes.statement){
                            return (<div key={i} style={{display: "flex", flexDirection: "row", backgroundColor: "#ffffff", padding: '16px', margin:"1%", borderRadius: 8 }}>
                            <div style={{display: "flex", flexDirection: "column", justifyContent:"center"}}>
                                    <div>{p.repost_count}</div>
                                <Link to="/create-statement">
                                    <Button onClick={()=>{props.setStatementToJoin(p.content)}} variant='contained' 
                                    sx={{backgroundColor:"rgba(42,74,103,1)", borderRadius: 8}}>
                                        <PlusOneIcon variant='contained'/>
                                    </Button>
                                </Link>
                            </div>
                            <Link to={"/statement/" + b64ToHex(p.hash_b64)} style={{flexGrow: 1}}>
                                <div className="statement" 
                                    style={{padding: "10px",margin: "10px", width:"100%", textAlign: "left", flexGrow: 1, "a:textDecoration":'none'}} key={i}> 
                                    {p.content.split("\n").map((s,i)=>(<div key={i}>{s}</div>))}
                                    <img src={'https://www.'+p.domain+'/favicon.ico'} style={{
                                    width: "20px", height: "20px", borderRadius: "10px", paddingTop: "8px", paddingRight: "3px"
                                }}></img><span style={{fontSize: "10pt", color: "rgba(80,80,80,1"}}>{p.name ? p.name : p.domain}</span>
                                </div>
                            </Link>
                        </div>
                    )
                        }
                        if (p.type == statementTypes.poll){

                            const statementParsed = p.statement.match(statementRegex).groups
                            const contentParsed = statementParsed.content.match(contentRegex).groups
                            const pollParsed = contentParsed.typedContent.match(pollRegex).groups

                            const votingContent = `
	type: vote
	poll: ${p.hash_b64}
	vote: ${pollParsed.option1}
`
                            return (<div key={i} style={{display: "flex", flexDirection: "row", backgroundColor: "#ffffff", padding: '16px', margin:"1%", borderRadius: 8 }}>
                            <div style={{display: "flex", flexDirection: "column", justifyContent:"center"}}>
                                    <div>{p.repost_count}</div>
                                <Link to="/create-statement">
                                    <Button onClick={()=>{props.setStatementToJoin(votingContent)}} variant='contained' 
                                    sx={{backgroundColor:"rgba(42,74,103,1)", borderRadius: 8}}>
                                        <PollIcon variant='contained'/>
                                    </Button>
                                </Link>
                            </div>
                            <Link to={"/statement/" + b64ToHex(p.hash_b64)} style={{flexGrow: 1}}>
                                <div className="statement" 
                                    style={{padding: "10px",margin: "10px", width:"100%", textAlign: "left", flexGrow: 1, "a:textDecoration":'none'}} key={i}> 
                                    {p.content.split("\n").map((s,i)=>(<div key={i}>{s}</div>))}
                                    <img src={'https://www.'+p.domain+'/favicon.ico'} style={{
                                    width: "20px", height: "20px", borderRadius: "10px", paddingTop: "8px", paddingRight: "3px"
                                }}></img><span style={{fontSize: "10pt", color: "rgba(80,80,80,1"}}>{p.name ? p.name : p.domain}</span>
                                </div>
                            </Link>
                        </div>
                    )
                    }})
                    }
                </div>
            </div>
        </div>
    )
}

export default Statements
