import { statementDB } from "../api";
import TextareaAutosize from '@mui/material/TextareaAutosize';
import AES from 'crypto-js/aes';
import encodeUTF8 from 'crypto-js/enc-utf8';
import { fromUrlSafe } from "../utils/hash";
import { Autocomplete, Box, TextField } from "@mui/material";
import React from "react";


export const DecryptedContent = ({ statement, decryptionKey, decryptionAlgorithm }:
    { statement: statementDB, decryptionKey: string, decryptionAlgorithm: string }) => {

    const [key, setKey] = React.useState<string>(decryptionKey);
    const [algorithm, setAlgorithm] = React.useState<string>(decryptionAlgorithm);
    const [algorithmObject, setAlgorithmObject] = React.useState<string[]>(["AES"]);

    let decryptedContent = statement?.content;
    try {
        if (algorithm.toLowerCase() === "aes") {
            const decrypted = AES.decrypt(fromUrlSafe(statement?.content).replace(/\n/g, ''), key);
            decryptedContent = decrypted.toString(encodeUTF8);
        }
    } catch (e) {
        console.error(e);
        decryptedContent = "Error decrypting content";
    }

    return (
        <>
            <p>Decrypted content</p>
            <TextField
                id="key"
                variant="outlined"
                label="Decryption key"
                onChange={e => { setKey(e.target.value) }}
                defaultValue={key}
                margin="normal"
                fullWidth
            />
            <Autocomplete
                id="algorithm"
                options={[
                    ["AES", "AES"],
                ]}
                autoHighlight
                getOptionLabel={(option) => option ? option[1] : ''}
                onChange={(e, newvalue) => setAlgorithmObject(newvalue as string[])}
                value={algorithmObject}
                inputValue={algorithm}
                onInputChange={(event, newInputValue) => setAlgorithm(newInputValue)}
                renderInput={(params) => <TextField {...params} label="Decryption algorithm" />}
                // @ts-ignore
                renderOption={(props, option) => (<Box {...props} id={option[0]} >{option[1]}</Box>)}
                sx={{ marginTop: "20px" }}
            />
            <TextareaAutosize style={{
                width: "100%", height: (('' + decryptedContent).match(/\n/g) ?
                    (40 + (('' + decryptedContent).match(/\n/g)?.length || 0) * 18) + 'px' : "60px"),
                overflow: "scroll", fontFamily: "Helvetica", fontSize: "15px",
                marginTop: "24px", marginBottom: "20px"
            }} value={decryptedContent} />
        </>
    )
}
