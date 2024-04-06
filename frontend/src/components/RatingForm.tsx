import React from 'react'

import { sha256 } from '../utils/hash';

import FormControl from '@mui/material/FormControl';
import { Autocomplete, Box, Rating, TextField, Typography } from '@mui/material';

import { buildRating, buildStatement, parseStatement, parseRating } from '../statementFormats'
import PublishStatement from './PublishStatement';
import { sendEmail } from './generateEmail';
import { filePath } from './SignPDFForm';
import { uploadPdf, backendHost } from "../api";

export const qualitiesToRateOn = [
    ["Reducing existential risks"],
    ["Reducing risks to democracy"],
    ["Benefitting society"],
    ["Honest use of the stated.ai platform"],
]
export const subjectTypes = [
    ["Organisation"],
    ["Policy proposal"],
    ["Treaty draft"],
    ["Regulation"],
    ["Research publication"],
    ["Product"],
]

const suggestFile = (t:string) => ['Policy proposal', 'Treaty draft', 'Regulation', 'Research publication'].includes(t)

export const RatingForm = (props:FormProps & {subjectToRate?: Partial<RatingDB & StatementDB>}) => {

    const [subjectName, setSubjectName] = React.useState(props.subjectToRate?.subject_name??"");
    const [subjectReference, setSubjectReference] = React.useState(props.subjectToRate?.subject_reference??"");
    const [rating, setRating] = React.useState(props.subjectToRate?.rating as null | undefined | number);
    const [quality, setQuality] = React.useState(props.subjectToRate?.quality);
    const [qualityObject, setQualityObject] = React.useState(undefined as undefined | string[]);
    const [comment, setComment] = React.useState(props.subjectToRate?.comment??"");

    const content = props.subjectToRate?.content
    let originalHost = props.statementToJoin?.domain
    if (originalHost) {
        originalHost = 'https://stated.' + originalHost
    }
    const parsedRating = content ? parseRating(content) : undefined
    const [subjectTypeObject, setSubjectTypeObject] = React.useState(undefined as undefined | string[]);
    const [subjectType, setSubjectType] = React.useState(parsedRating?.subjectType??"");
    const statementToJoinHash = content && parseRating(content)?.documentFileHash
    const [fileHash, setFileHash] = React.useState(statementToJoinHash || "");
    const [fileURL, setFileURL] = React.useState("");
    const [dragActive, setDragActive] = React.useState(false);

    const prepareStatement:prepareStatement = ({method})  => {
        try {
            props.setPublishingMethod(method)
            const content = buildRating({subjectName, subjectType: subjectType as RatingSubjectTypeValue ?? undefined,
                subjectReference, rating: rating as number, comment, quality: quality ?? undefined, documentFileHash: fileHash})
            if(method === 'represent'){
                parseRating(content)
                sendEmail({content, props})
                return
            }
            const statement = buildStatement({domain: props.metaData.domain, author: props.metaData.author, 
                representative: props.metaData.representative, tags: props.metaData.tags, 
                supersededStatement: props.metaData.supersededStatement, time: new Date(props.serverTime), content})
            const parsedStatement = parseStatement({statement})
            parseRating(parsedStatement.content)
            props.setStatement(statement)
            sha256(statement).then((hash) => props.setStatementHash(hash))
        } catch (e: any) {
            props.setAlertMessage('Error: ' + (e?.message??''))
            props.setisError(true)
        }
    }
    const handleFiles = (file: Blob) => {
        console.log(file);
        const fileReader = new FileReader();
    
        fileReader.readAsDataURL(file);
        fileReader.onload = (e) => {
          console.log(e);
          if (e.target && e.target.result) {
            uploadPdf(
              { file: e.target.result },
              (s: {sha256sum: string, filePath:string}) => {
                console.log("success ", s);
                setFileURL(backendHost + '/' + s.filePath);
                setFileHash(s.sha256sum);
              },
              (e: Error) => {
                console.log("error ", e);
              }
            );
          }
        };
      };
      const onDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
          setDragActive(true);
        } else if (e.type === "dragleave") {
          setDragActive(false);
        }
      };
      const onDrop = (e: React.DragEvent<HTMLInputElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleFiles(e.dataTransfer.files[0]);
        }
      };
      const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
          handleFiles(e.target.files[0]);
        }
      };
        
    return (
        <FormControl sx={{width: "100%"}}>
        <Autocomplete
            id="subject_type"
            options={subjectTypes}
            autoHighlight
            getOptionLabel={(option) => option ? option[0] : ''}
            freeSolo
            onChange={(e,newvalue)=>setSubjectTypeObject(newvalue as string[]) }
            inputValue={subjectType ?? undefined}
            value={subjectTypeObject}
            onInputChange={(event, newInputValue) => setSubjectType(newInputValue)}
            renderInput={(params) => <TextField {...params} label="Type of subject to be rated (optional)" />}
            // @ts-ignore
            renderOption={(props, option) => (<Box {...props} id={option[0]} >{option[0]}</Box>)}
            sx={{marginBottom: "12px", marginTop: "12px"}}
        />
        <TextField
            id="Name of the organisation, service or proposal to be rated"
            variant="outlined"
            placeholder='Walmart Inc.'
            label="Name of the organisation, service or proposal to be rated"
            onChange={e => { setSubjectName(e.target.value) }}
            value={subjectName}
            margin="normal"
            sx={{marginTop: "12px"}}
        />
        <TextField
            id="URL that identifies the subject (optional)"
            variant="outlined"
            placeholder='walmart.com'
            label="URL that identifies the subject (optional)"
            onChange={e => { setSubjectReference(e.target.value) }}
            value={subjectReference}
            margin="normal"
            sx={{marginBottom: "12px"}}
        />
        {fileHash ? (
            <embed
                src={(fileURL ? fileURL : filePath( fileHash, (originalHost || backendHost)))}
                width="100%"
                height="300px"
                type="application/pdf"
            />
        ) : ( suggestFile(subjectType) && (
            <form
                id="fileUploadForm"
                onDragEnter={onDrag}
                onSubmit={(e) => e.preventDefault()}
            >
            <input
                type="file"
                id="fileInput"
                multiple={true}
                onChange={onChange}
                style={{display: "none"}}
            />
            <label
                id="fileInputLabel"
                htmlFor="fileInput"
                className={dragActive ? "dragging" : ""}
            >
                <div>
                <p>Drag PDF file here</p>
                </div>
            </label>
            {dragActive && (
                <div
                id="fileInputLabelOverlay"
                onDragEnter={onDrag}
                onDragLeave={onDrag}
                onDragOver={onDrag}
                onDrop={onDrop}
                ></div>
            )}
            </form>
        ))}
        { (fileHash || suggestFile(subjectType)) && (
        <TextField
            id="PDF file hash (i.e. for a policy proposal)"
            variant="outlined"
            placeholder="imdba856CQZlcZVhxFt4RP/SmYQpP75NYer4PylIUOs="
            label="PDF file Hash (i.e. for a policy proposal)"
            onChange={(e) => {
                setFileHash(e.target.value);
                if (! fileURL.match('/'+e.target.value+'.pdf')){
                    setFileURL(filePath(e.target.value,backendHost))
                }
            }}
            value={fileHash}
            margin="normal"
            sx={{ marginBottom: "24px" }}
        />)}
        <Autocomplete
            id="quality"
            options={qualitiesToRateOn}
            autoHighlight
            getOptionLabel={(option) => option ? option[0] : ''}
            freeSolo
            onChange={(e,newvalue)=>setQualityObject(newvalue as string[]) }
            inputValue={quality ?? undefined}
            value={qualityObject}
            onInputChange={(event, newInputValue) => setQuality(newInputValue)}
            renderInput={(params) => <TextField {...params} label="Quality of the subject which is rated (optional)" />}
            // @ts-ignore
            renderOption={(props, option) => (<Box {...props} id={option[0]} >{option[0]}</Box>)}
            sx={{marginBottom: "12px", marginTop: "12px"}}
        />
        <Typography component="legend">Your rating</Typography>
        <Rating
            name="simple-controlled"
            value={rating}
            onChange={(event, newValue) => {
                setRating(newValue);
            }}
        />

        <TextField
            id="comment"
            variant="outlined"
            multiline
            rows={4}
            placeholder='We are very happy with the serivce..'
            label="Comment (optional)"
            onChange={e => { setComment(e.target.value) }}
            margin="normal"
            value={comment}
            sx={{marginTop: "24px", width: (props.lt850px ? "90vw" :"50vw"), maxWidth: "500px"}}
        />
        {props.children}
        <PublishStatement prepareStatement={prepareStatement} serverTime={props.serverTime} authorDomain={props.metaData.domain}/>
        </FormControl>
    )
}

export default RatingForm