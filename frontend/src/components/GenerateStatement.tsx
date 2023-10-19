import React from 'react'

import Button from '@mui/material/Button';

type props = {
    serverTime: Date,
    authorDomain?: string,
    prepareStatement: prepareStatement
}

const GenerateStatement = (props:props) => {
    return (
        <React.Fragment>
            <div style={{textAlign: "left", marginTop: "16px"}}>Time: {props.serverTime.toUTCString()}</div>
            <div style={{display: "flex", flexDirection:"row", flexWrap: "wrap"}}>
                {props.authorDomain && (<Button variant="contained" onClick={() => props.prepareStatement({method: 'static'})}
                    sx={{margin: "12px", flexGrow: 1, minWidth: "200px"}}>
                    Authenticate by publishing a file on {props.authorDomain}
                </Button>)}
                {props.authorDomain && (<Button variant="contained" onClick={() => props.prepareStatement({method: 'dns'})}
                    sx={{margin: "12px", flexGrow: 1, minWidth: "200px"}}>
                    Authenticate by adding a DNS record on {props.authorDomain}
                </Button>)}
                <Button variant="contained" onClick={() => props.prepareStatement({method: 'api'})}
                    sx={{margin: "12px",flexGrow: 1, minWidth: "200px"}}>
                    Publish using an API key for {window.location.hostname}
                </Button>
                <Button variant="contained" onClick={() => props.prepareStatement({method: 'represent'})}
                    sx={{margin: "12px",flexGrow: 1, minWidth: "200px"}}>
                    Ask {window.location.hostname} to publish for you via email
                </Button>
            </div>
        </React.Fragment>
    )
}

export default GenerateStatement
