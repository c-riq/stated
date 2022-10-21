import { flexbox } from '@mui/system';
import React from 'react'
import PlusOneIcon from '@mui/icons-material/PlusOne';
import Button from '@mui/material/Button';
import {Buffer} from 'buffer';
import { Link } from 'react-router-dom';

const b64ToHex = (b64) => {
    const buffer = Buffer.from(b64, 'base64');
    return buffer.toString('hex');
}


const Statements = props => {
    return (
        <div style={{ padding: "7%",margin: "2%", borderRadius: 8 }}>
            <div style={{ width: "70vw", maxWidth: "1200px" }}>
            <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}><h3>Statements</h3> {props.children}</div>
                {props.posts && props.posts.length > 0 && props.posts.map((p,i) => (
                    <div key={i} style={{display: "flex", flexDirection: "row", backgroundColor: "#ffffff", padding: '16px', margin:"1%", borderRadius: 8 }}>
                        <div style={{display: "flex", flexDirection: "column", justifyContent:"center"}}>
                                <div>{p.repost_count}</div>
                            <Link to="/create-statement">
                                <Button onClick={()=>{props.setStatementToJoin(p.content)}} variant='contained' 
                                sx={{backgroundColor:"rgba(42,74,103,1)", borderRadius: 8}}>
                                    <PlusOneIcon variant='contained'/>
                                </Button>
                            </Link>
                        </div>
                        <Link to={"/statement/"+Buffer.from(p.hash_b64, 'base64').toString('hex')}>
                            <div className="statement" 
                                style={{padding: "10px",margin: "10px", textAlign: "left", flexGrow: 1, "a:textDecoration":'none'}} key={i}> 
                                {p.content.split("\n").map((s,i)=>(<div key={i}>{s}</div>))}
                                <img src={'https://www.'+p.domain+'/favicon.ico'} style={{
                                width: "20px", height: "20px", borderRadius: "10px", paddingTop: "8px", paddingRight: "3px"
                            }}></img><span style={{fontSize: "10pt", color: "rgba(80,80,80,1"}}>{p.name ? p.name : p.domain}</span>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    )
}


export default Statements