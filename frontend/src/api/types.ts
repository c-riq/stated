import { QueryResult, QueryResultRow } from "pg";

export type method = "GET" | "POST" | "PUT" | "DELETE";
export type resDB<T extends QueryResultRow> = {
  statements: QueryResult<T>["rows"];
  time: string;
};
export type cb<T> = (arg0: T[] | undefined) => void;
export type validatedResponseHandler<T> = (arg0: T) => void;
export type _cb = (arg0: any) => void;

export type dnsRes = {
  records: string[];
};
export type vlogRes = {
  result: VerificationLogDB[];
};
export type domainSuggestionResponse = {
  result: {
    domain: string;
    organisation: string;
  }[];
};
export type nameSuggestionResponse = {
  result: {
    domain: string;
    organisation: string;
    statement_hash: string;
  }[];
};
