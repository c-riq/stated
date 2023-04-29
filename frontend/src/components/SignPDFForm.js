import React from "react";

import FormControl from "@mui/material/FormControl";
import TextField from "@mui/material/TextField";

import { sha256 } from "../utils/hash";
import {
  buildPDFSigningContent,
  buildStatement,
  parseStatement,
  forbiddenStrings,
  parsePDFSigning,
} from "../constants/statementFormats.js";
import GenerateStatement from "./GenerateStatement";
import { uploadPdf, backendHost } from "../api";

export const filePath = ({hash, host}) => (host || backendHost) + "/files/" + hash + ".pdf"

const SignPDFForm = (props) => {
  const content = props.statementToJoin?.content
  let originalHost = props.statementToJoin?.domain
  if (originalHost) {
    originalHost = 'https://stated.' + originalHost
  }
  const statementToJoinHash = content && parsePDFSigning(content)?.hash_b64
  const [fileHash, setFileHash] = React.useState(statementToJoinHash || "");
  const [fileURL, setFileURL] = React.useState("");
  const [dragActive, setDragActive] = React.useState(false);

  const generateHash = ({ viaAPI }) => {
    props.setViaAPI(viaAPI);
    const content = buildPDFSigningContent({ hash_b64: fileHash });
    const statement = buildStatement({
      domain: props.domain,
      author: props.author,
      time: props.serverTime,
      content,
    });

    const parsedStatement = parseStatement(statement);
    if (forbiddenStrings(Object.values(parsedStatement)).length > 0) {
      props.setAlertMessage(
        "Values contain forbidden Characters: " +
          forbiddenStrings(Object.values(parsedStatement))
      );
      props.setisError(true);
      return;
    }
    const parsedPDFSigning = parsePDFSigning(parsedStatement.content);
    if (!parsedPDFSigning) {
      props.setAlertMessage("Invalid PDF signing statement (missing values)");
      props.setisError(true);
      return;
    }
    props.setStatement(statement);
    sha256(statement).then((value) => { props.setStatementHash(value); });
  };
  const handleFiles = ({ file }) => {
    console.log(file);
    const fileReader = new FileReader();

    fileReader.readAsDataURL(file);
    fileReader.onload = (e) => {
      console.log(e);
      if (e.target && e.target.result) {
        uploadPdf(
          { file: e.target.result },
          (s) => {
            console.log("success ", s);
            setFileURL(backendHost + '/' + s.filePath);
            setFileHash(s.sha256sum);
          },
          (e) => {
            console.log("error ", e);
          }
        );
      }
    };
  };
  const onDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles({ file: e.dataTransfer.files[0] });
    }
  };
  const onChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles({ file: e.target.files[0] });
    }
  };

  return (
    <FormControl sx={{ width: "100%" }}>
      {fileHash ? (
        <embed
          src={
            (fileURL ? fileURL : filePath({hash: fileHash, host: originalHost || backendHost}))
          }
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
                setFileURL(filePath({hash: e.target.value, host: backendHost}))
            }
        }}
        value={fileHash}
        margin="normal"
        sx={{ marginBottom: "24px" }}
      />
      {props.children}
      <GenerateStatement
        generateHash={generateHash}
        serverTime={props.serverTime}
      />
    </FormControl>
  );
};

export default SignPDFForm;
