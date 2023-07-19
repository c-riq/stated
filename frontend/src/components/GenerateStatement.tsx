import React from 'react'

import Button from '@mui/material/Button';

type props = {
    serverTime: Date,
    generateHash: generateHash
}

const GenerateStatement = (props:props) => {
    return (
        <React.Fragment>
            <div style={{textAlign: "left", marginTop: "16px"}}>Time: {props.serverTime.toUTCString()}</div>
            <div style={{display: "flex", flexDirection:"row"}}>
                <Button variant="contained" onClick={() => props.generateHash({viaAPI: false})}
                    sx={{marginTop: "24px", flexGrow: 1, marginRight: "10px", marginBottom: "12px"}}>
                    Authenticate via DNS
                </Button>
                <Button variant="contained" onClick={() => props.generateHash({viaAPI: true})}
                    sx={{marginTop: "24px", flexGrow: 1, marginBottom: "12px"}}>
                    Publish as {window.location.hostname}
                </Button>
            </div>
        </React.Fragment>
    )
}

export default GenerateStatement
