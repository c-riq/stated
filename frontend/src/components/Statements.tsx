import React from 'react'
import PlusOneIcon from '@mui/icons-material/PlusOne';
import PollIcon from '@mui/icons-material/Poll';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

import { Link } from 'react-router-dom';

import { parsePoll, statementTypes, BountyKeys, organisationVerificationKeys, PDFSigningKeys, ratingKeys } from '../statementFormats'
import { statementWithDetails } from '../api';

const highlightedStatement = (text: string, type:string) => {
    let regex = /(\nType: )/
    if (type === statementTypes.bounty){
        regex = BountyKeys
    }
    if (type === statementTypes.organisationVerification){
        regex = organisationVerificationKeys
    }
    if (type === statementTypes.signPdf){
        regex = PDFSigningKeys
    }
    if (type === statementTypes.rating){
        regex = ratingKeys
    }
    const parts = text.split(new RegExp(regex, 'g'));
    return <span>{ parts.map((v, i) => 
        <><span key={i} style={regex.test(v) ? 
            {fontWeight: '200',color: 'rgb(58,58,58)', fontSize:'13px'} : 
            {fontWeight: '550',color: 'rgb(42, 72, 103)'}}>
            {regex.test(v) ? v.replace(/: $/, ':') : v}
        </span>
        {regex.test(v) ? ' ' : '' }
        </>)
    } </span>;
}

type props = {
    statements: statementWithDetails[],
    setStatementToJoin: any,
    setServerTime: (arg0: Date) => void,
    setModalOpen: any,
    lt850px: boolean,
    children: any,
    voteOnPoll: any,
}

const Statements = (props:props) => {
    const { lt850px } = props
    const statements = props.statements
    return (
        <div style={lt850px ? {marginBottom : "10%" } : { margin: "2%", borderRadius: 8 }}>
            <div style={lt850px ? {width: "100vw"} : { width: "70vw", maxWidth: "900px" }}>
            <div style={{...{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}, ...(lt850px ? {margin:"4%"}:{})}}>
                <h3>Statements</h3> {props.children}</div>
                <div style ={(lt850px ? {} : {minHeight: '50vh'})}>
                    {statements && statements.length === 0 && (<div style={{marginTop: '50px'}}>no statements found.</div>)}
                    {statements && statements.length > 0 && statements.map((s,i) => {
                        if ([statementTypes.statement,statementTypes.organisationVerification,
                        statementTypes.signPdf, statementTypes.rating, statementTypes.bounty].includes(s.type || '')){
                            return (<div key={i} style={{display: "flex", flexDirection: "row", backgroundColor: "#ffffff", padding: '16px', margin:"1%", borderRadius: 8 }}>
                            <div style={{display: "flex", flexDirection: "column", justifyContent:"start"}}>
                                    <div>{s.repost_count}</div>
                                <Link to="/create-statement">
                                    <Button onClick={()=>{props.setStatementToJoin(s); props.setModalOpen()}} variant='contained' 
                                    sx={{backgroundColor:"rgba(42,74,103,1)", borderRadius: 8}}>
                                        <PlusOneIcon/>
                                    </Button>
                                </Link>
                            </div>
                            <Link to={"/statement/" + s.hash_b64} style={{flexGrow: 1}} onClick={()=>{props.setModalOpen()}} >
                                <div className="statement" 
                                // @ts-ignore 
                                    style={{padding: "10px",margin: "10px", width:"100%", textAlign: "left", flexGrow: 1, "a:textDecoration":'none'}} key={i}> 
                                    {s.content.split("\n").map((s1:string,i:number)=>(<div key={i}>{highlightedStatement(s1, s.type || '')}</div>))}
                                    <img src={'https://www.'+s.domain+'/favicon.ico'} style={{
                                    width: "20px", height: "20px", borderRadius: "10px", paddingTop: "8px", paddingRight: "3px"
                                }}></img><span style={{fontSize: "10pt", color: "rgba(80,80,80,1"}}>{s.name ? s.name : s.domain}</span>
                                </div>
                            </Link>
                        </div>
                    )
                        }
                        if (s.type === statementTypes.poll){
                            let parsedPoll = undefined
                            try{
                                parsedPoll = parsePoll(s.content)
                            } catch (e){
                                console.log(e)
                                return (<></>)
                            }
                            const options = parsedPoll.options
                            let votes: {[key: string]: number} = {} 
                            if (s.votes){
                                for (let o of Object.keys(s.votes)){
                                    // @ts-ignore
                                    votes[o] = s.votes[o]
                                }
                            }
                            for (let o of options){
                                if(!(votes[o])){
                                    votes[o] = 0
                                }
                            }
                            const totalVotes = Object.values((votes || [0])).reduce((a:number,b:number)=>a+b, 0)
                            return (<div key={i} style={{display: "flex", flexDirection: "row", backgroundColor: "#ffffff", padding: '16px', margin:"1%", borderRadius: 8 }}>
                            <div style={{display: "flex", flexDirection: "column", justifyContent:"start"}}>
                                    <div>{s.repost_count}</div>
                                <Link to="/create-statement">
                                    <Button onClick={()=>{props.voteOnPoll(s);props.setModalOpen()}} variant='contained' 
                                    sx={{backgroundColor:"rgba(42,74,103,1)", borderRadius: 8}}>
                                        <PollIcon/>
                                    </Button>
                                </Link>
                            </div>
                            <Link to={"/statement/" + s.hash_b64} style={{flexGrow: 1}}>
                                <div className="statement"
                                    // @ts-ignore
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
