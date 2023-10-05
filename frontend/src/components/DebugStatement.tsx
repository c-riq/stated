import React from 'react'

import TextField from '@mui/material/TextField';
import { parseStatement } from '../statementFormats';
import Checkbox from '@mui/material/Checkbox';
import { FormControlLabel } from '@mui/material';


type Props = {
    lt850px: boolean,
    domain?: string,
}

const defaultStatementStr = `Publishing domain: rixdata.net
Author: Rix Data NL B.V.
Time: Thu, 15 Jun 2023 20:01:26 GMT
Statement content: hello world
`

const defaultRegexStr = `new RegExp(''
+ /^Publishing domain: (?<domain>[^\\n]+?)\\n/.source
+ /Author: (?<author>[^\\n]+?)\\n/.source
+ /(?:Authorized signing representative: (?<representative>[^\\n]*?)\\n)?/.source
+ /Time: (?<time>[^\\n]+?)\\n/.source
+ /(?:Tags: (?<tags>[^\\n]*?)\\n)?/.source
+ /(?:Superseded statement: (?<supersededStatement>[^\\n]*?)\\n)?/.source
+ /Statement content: (?:(?<typedContent>\\n\tType: (?<type>[^\\n]+?)\\n[\\s\\S]+?\\n$)|(?<content>[\\s\\S]+?\\n$))/.source
);`

const DebugStatement = (props: Props) => {
    const [statement, setStatement] = React.useState(defaultStatementStr);
    const [useCustomRegex, setUserCustomRegex] = React.useState(false);
    const [regex, setRegex] = React.useState(defaultRegexStr);
    const [result, setResult] = React.useState('');

    React.useEffect(() => {
        try {
            if(regex && useCustomRegex){
                const regexObj = eval(regex.replace(/\\n/g, '\\n')) as RegExp;
                const parsed = statement.match(regexObj)
                setResult(JSON.stringify(parsed, null, 2));
            } else {
                const parsed = parseStatement(statement);
                setResult(JSON.stringify(parsed, null, 2));
            }
        } catch (e: any) {
            console.log(e);
            setResult(e.message);
        }
    }, [statement, regex])

    return (
        <div style={{
            padding: "7%", backgroundColor: "white", borderRadius: 8, display: 'flex',
            flexDirection: 'row', justifyContent: 'center'
        }}>
            <div style={{width: "500px"}}>
                <h3 style={{ marginBottom: "50px" }}>Debug Statement</h3>

                <div>
                    <div>Statement:</div>
                    <div style={{ backgroundColor: "#cccccc" }}>
                        <TextField
                            id="statement"
                            variant="outlined"
                            placeholder=''
                            label=""
                            multiline
                            rows={12}
                            onChange={(e) => setStatement(e.target.value)}
                            value={statement}
                            // @ts-ignore
                            sx={{ width: "100%", overflowX: "scroll" }}
                        />
                    </div>

                    <FormControlLabel
                    control={<Checkbox checked={useCustomRegex} onChange={(event) => {
                        setUserCustomRegex(event.target.checked);
                    }} />}
                    label="Use custom regex"
                    />

                    <div>Custom Regex:</div>
                    <div style={{ backgroundColor: "#cccccc" }}>
                        <TextField
                            id="statement"
                            variant="outlined"
                            placeholder=''
                            label=""
                            multiline
                            rows={12}
                            onChange={(e) => setRegex(e.target.value)}
                            value={regex}
                            disabled={!useCustomRegex}
                            // @ts-ignore
                            sx={{ width: "100%", overflowX: "scroll" }}
                        />
                    </div>
                    <div>Parsed statement:</div>
                    <div style={{ backgroundColor: "#cccccc" }}>
                        <TextField
                            id="statement"
                            variant="outlined"
                            placeholder=''
                            label=""
                            rows={15}
                            multiline
                            value={result}
                            // @ts-ignore
                            sx={{ width: "100%", overflowX: "scroll" }}
                        />
                    </div>
                </div>

            </div>
        </div>
    )
}

export default DebugStatement
