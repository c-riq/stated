import React from "react";

import FormControl from "@mui/material/FormControl";
import TextField from "@mui/material/TextField";

import { sha256 } from "../utils/hash";
import {
  buildPDFSigningContent,
  buildStatement,
  parseStatement,
  parsePDFSigning,
} from "../statementFormats";
import PublishStatement from "./PublishStatement";
import { uploadPdf, backendHost } from "../api";
import { sendEmail } from "./generateEmail";

export const filePath = (hash:string, host:string|undefined) => (host || backendHost) + "/files/" + hash + ".pdf"

export const getWorkingFileURL = async (hash:string, host:string) => {
  const promises = [host,backendHost].map(h => fetch(h + "/files/" + hash + ".pdf", {method: "OPTIONS"}))
  const responses = await Promise.allSettled(promises)
  return (responses.find(r => r.status === "fulfilled") as PromiseFulfilledResult<any>)?.value?.url
}

const SignPDFForm = (props:FormProps) => {
  const content = props.statementToJoin?.content
  let originalHost = props.statementToJoin?.domain
  if (originalHost) {
    originalHost = 'https://stated.' + originalHost
  }
  const statementToJoinHash = content && parsePDFSigning(content)?.hash
  const [fileHash, setFileHash] = React.useState(statementToJoinHash || "");
  const [fileURL, setFileURL] = React.useState("");
  const [dragActive, setDragActive] = React.useState(false);

  const prepareStatement:prepareStatement = ({method}) => {
    try {
      props.setPublishingMethod(method);
      const content = buildPDFSigningContent({ hash: fileHash });
      if(method === 'represent'){
        parsePDFSigning(content)
        sendEmail({content, props})
        return
    }
      const statement = buildStatement({
        domain: props.metaData.domain,
        author: props.metaData.author,
        tags: props.metaData.tags, supersededStatement: props.metaData.supersededStatement,
        representative: props.metaData.representative,
        time: new Date(props.serverTime),
        content,
      });

      const parsedStatement = parseStatement({statement});
      parsePDFSigning(parsedStatement.content);
      props.setStatement(statement);
      sha256(statement).then((hash) => props.setStatementHash(hash))
    } catch (error) {
      props.setAlertMessage("Invalid PDF signing statement format");
      props.setisError(true);
    }
  };
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
    <FormControl sx={{ width: "100%" }}>
      {fileHash ? (
        <embed
          src={(fileURL ? fileURL : filePath( fileHash, (originalHost || backendHost)))}
          width="100%"
          height="300px"
          type="application/pdf"
        />
      ) : (
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
      )}
      <TextField
        id="PDF file hash"
        variant="outlined"
        placeholder="imdba856CQZlcZVhxFt4RP/SmYQpP75NYer4PylIUOs="
        label="PDF file Hash"
        onChange={(e) => {
            setFileHash(e.target.value);
            if (! fileURL.match('/'+e.target.value+'.pdf')){
                setFileURL(filePath(e.target.value,backendHost))
            }
        }}
        value={fileHash}
        margin="normal"
        sx={{ marginBottom: "24px" }}
      />
      {props.children}
      <PublishStatement
        prepareStatement={prepareStatement}
        serverTime={props.serverTime}
        authorDomain={props.metaData.domain}
      />
    </FormControl>
  );
};

export default SignPDFForm;
