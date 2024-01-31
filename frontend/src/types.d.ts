import { StatementDB } from "./api";

type statementMetaData = {
  domain: string;
  author: string;
  representative?: string;
  supersededStatement?: string;
  tags?: string[];
};
type FormProps = {
  metaData: statementMetaData;
  serverTime: Date;
  statementToJoin?: statementWithDetails | StatementDB;
  children?: any;
  setStatement: (statement: string) => void;
  setStatementHash: (hash: string) => void;
  setAlertMessage: (message: string) => void;
  setisError: (isError: boolean) => void;
  setPublishingMethod: (arg0: publishingMethod) => void;
};
type publishingMethod = "api" | "dns" | "represent" | "static";
type prepareStatement = (arg0: { method: publishingMethod }) => void;
