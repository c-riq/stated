import React from 'react'

import Button from '@mui/material/Button';

type props = {
    serverTime: Date,
    prepareStatement: prepareStatement
}

const GenerateStatement = (props:props) => {
    return (
        <React.Fragment>
            <div style={{textAlign: "left", marginTop: "16px"}}>Time: {props.serverTime.toUTCString()}</div>
            <div style={{display: "flex", flexDirection:"row", flexWrap: "wrap"}}>
                <Button variant="contained" onClick={() => props.prepareStatement({method: 'dns'})}
                    sx={{margin: "12px", flexGrow: 1, minWidth: "200px"}}>
                    Authenticate via DNS
                </Button>
                <Button variant="contained" onClick={() => props.prepareStatement({method: 'api'})}
                    sx={{margin: "12px",flexGrow: 1, minWidth: "200px"}}>
                    Publish as {window.location.hostname}
                </Button>
                <Button variant="contained" onClick={() => props.prepareStatement({method: 'represent'})}
                    sx={{margin: "12px",flexGrow: 1, minWidth: "200px"}}>
                    Ask us to publish for you
                </Button>
            </div>
        </React.Fragment>
    )
}

export default GenerateStatement
