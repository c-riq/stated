import React from 'react'
import PlusOneIcon from '@mui/icons-material/PlusOne';
import PollIcon from '@mui/icons-material/Poll';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

import { Link } from 'react-router-dom';

import { parsePoll, statementTypes } from '../constants/statementFormats.js'


const Statements = props => {
    const { lt850px } = props
    return (
        <div style={lt850px ? {marginBottom : "10%" } : { padding: "7%",margin: "2%", borderRadius: 8 }}>
            <div style={lt850px ? {width: "100vw"} : { width: "70vw", maxWidth: "900px" }}>
            <div style={{...{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}, ...(lt850px ? {margin:"4%"}:{})}}>
                <h3>Statements</h3> {props.children}</div>
                <div style ={(lt850px ? {} : {minHeight: '50vh'})}>
                    {props.posts && props.posts.length === 0 && (<div style={{marginTop: '50px'}}>no statements found.</div>)}
                    {props.posts && props.posts.length > 0 && props.posts.map((s,i) => {
                        if ([statementTypes.statement,statementTypes.organisationVerification,
                        statementTypes.signPdf, statementTypes.rating].includes(s.type)){
                            return (<div key={i} style={{display: "flex", flexDirection: "row", backgroundColor: "#ffffff", padding: '16px', margin:"1%", borderRadius: 8 }}>
                            <div style={{display: "flex", flexDirection: "column", justifyContent:"start"}}>
                                    <div>{s.repost_count}</div>
                                <Link to="/create-statement">
                                    <Button onClick={()=>{props.setStatementToJoin(s)}} variant='contained' 
                                    sx={{backgroundColor:"rgba(42,74,103,1)", borderRadius: 8}}>
                                        <PlusOneIcon variant='contained'/>
                                    </Button>
                                </Link>
                            </div>
                            <Link to={"/statement/" + s.hash_b64} style={{flexGrow: 1}}>
                                <div className="statement" 
                                    style={{padding: "10px",margin: "10px", width:"100%", textAlign: "left", flexGrow: 1, "a:textDecoration":'none'}} key={i}> 
                                    {s.content.split("\n").map((s,i)=>(<div key={i}>{s}</div>))}
                                    <img src={'https://www.'+s.domain+'/favicon.ico'} style={{
                                    width: "20px", height: "20px", borderRadius: "10px", paddingTop: "8px", paddingRight: "3px"
                                }}></img><span style={{fontSize: "10pt", color: "rgba(80,80,80,1"}}>{s.name ? s.name : s.domain}</span>
                                </div>
                            </Link>
                        </div>
                    )
                        }
                        if (s.type == statementTypes.poll){
                            const parsedPoll = parsePoll(s.content)
                            const options = [parsedPoll.option1, parsedPoll.option2, parsedPoll.option3, 
                                parsedPoll.option4, parsedPoll.option5].filter(o=>o)
                            let votes = {}
                            if (s.votes){
                                for (let o of Object.keys(s.votes)){
                                    votes[o] = s.votes[o]
                                }
                            }
                            for (let o of options){
                                if(!(votes[o])){
                                    votes[o] = 0
                                }
                            }
                            const totalVotes = Object.values((votes || [0])).reduce((a,b)=>a+b, 0)
                            return (<div key={i} style={{display: "flex", flexDirection: "row", backgroundColor: "#ffffff", padding: '16px', margin:"1%", borderRadius: 8 }}>
                            <div style={{display: "flex", flexDirection: "column", justifyContent:"start"}}>
                                    <div>{s.repost_count}</div>
                                <Link to="/create-statement">
                                    <Button onClick={()=>{props.voteOnPoll(s)}} variant='contained' 
                                    sx={{backgroundColor:"rgba(42,74,103,1)", borderRadius: 8}}>
                                        <PollIcon variant='contained'/>
                                    </Button>
                                </Link>
                            </div>
                            <Link to={"/statement/" + s.hash_b64} style={{flexGrow: 1}}>
                                <div className="statement" 
                                    style={{padding: "10px",margin: "10px", width:"100%", textAlign: "left", flexGrow: 1, "a:textDecoration":'none'}} key={i}> 
                                    <div>{parsedPoll.poll}</div>
                                    <Stack spacing={2} sx={{paddingTop: "10px", paddingBottom: "10px"}}>
                                        {Object.keys(votes).map(o=>(
                                            <div key={o} style={{display: "grid"}}>
                                                <div style={{gridArea: "1 / 1"}}>
                                                    <div style={{backgroundColor: "rbga(0,0,0,0)", width:"200px", height:"30px", borderRadius: "15px", borderWidth: "1px", borderStyle: "solid", borderColor: "#cccccc"}} />
                                                </div>
                                                <div style={{gridArea: "1 / 1"}}>
                                                    <div style={{backgroundColor: "rgba(42, 74, 103, 0.5)", width: (totalVotes == 0 ? 0 : 200 * votes[o] / totalVotes) + 'px', height:"30px", borderRadius: "15px"}} />
                                                </div>
                                                <div style={{gridArea: "1 / 1"}}>
                                                    <div style={{backgroundColor: "rbga(0,0,0,0)", width:"200px", height:"30px", borderRadius: "15px", padding: "3px 5px 0px 10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
                                                        {o + ": " + votes[o] + "/" + totalVotes}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </Stack>
                                        
                                    <img src={'https://www.'+s.domain+'/favicon.ico'} style={{
                                    width: "20px", height: "20px", borderRadius: "10px", paddingTop: "8px", paddingRight: "3px"
                                }}></img><span style={{fontSize: "10pt", color: "rgba(80,80,80,1"}}>{s.name ? s.name : s.domain}</span>
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
