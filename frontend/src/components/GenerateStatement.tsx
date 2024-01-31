import React from 'react'

import Button from '@mui/material/Button';
import { prepareStatement } from '../types';

type props = {
    serverTime: Date,
    authorDomain?: string,
    prepareStatement: prepareStatement
}

const PublishStatement = (props:props) => {
    const [showAdditionalOptions, setShowAdditionalOptions] = React.useState(false);
    return (
        <React.Fragment>
            <div style={{textAlign: "left", marginTop: "16px"}}>Time: {props.serverTime.toUTCString()}</div>
            <div style={{display: "flex", flexDirection:"row", flexWrap: "wrap"}}>
                <Button variant="contained" onClick={() => props.prepareStatement({method: 'represent'})}
                    sx={{margin: "12px",flexGrow: 1, minWidth: "200px"}}>
                    Ask {window.location.hostname} to publish for you via email
                </Button>
                {showAdditionalOptions ? (<>
                    {props.authorDomain && (<>
                        <Button variant="contained" onClick={() => props.prepareStatement({method: 'static'})}
                            disabled={!props.authorDomain}
                            sx={{margin: "12px", flexGrow: 1, minWidth: "200px"}}>
                            Authenticate by publishing a file on {props.authorDomain || 'your website'}
                        </Button>
                        <Button variant="contained" onClick={() => props.prepareStatement({method: 'dns'})}
                            sx={{margin: "12px", flexGrow: 1, minWidth: "200px"}}>
                            Authenticate by adding a DNS record on {props.authorDomain}
                        </Button>
                    </>)}
                    <Button variant="contained" onClick={() => props.prepareStatement({method: 'api'})}
                        sx={{margin: "12px",flexGrow: 1, minWidth: "200px"}} data-testid="publish-using-api-key">
                        Publish using an API key for {window.location.hostname}
                    </Button>
                </>) : (props.authorDomain && (<Button onClick={() => setShowAdditionalOptions(true)}
                    sx={{margin: "12px", flexGrow: 1, minWidth: "200px"}} data-testid="show-additional-options">
                    Show additional options
                </Button>))}
            </div>
        </React.Fragment>
    )
}

export default PublishStatement
