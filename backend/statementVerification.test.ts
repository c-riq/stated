import { describe, expect, it, beforeEach, afterEach, test } from "@jest/globals"; // import {jest} from "@jest/globals";


//import * as m from "./statementVerification";
const m = jest.requireActual("./statementVerification");
//validateStatementMetadata = jest.fn();

describe("validateAndAddStatementIfMissing", () => {
  let spyInstance;

  beforeEach(() => {
    spyInstance = jest.spyOn(m, "validateStatementMetadata").mockReturnValue({
      content: "string",
      domain: "string",
      author: "string",
      tags: [],
      type: "string",
      content_hash_b64: "string",
      proclaimed_publication_time: 0,
      supersededStatement: "string",
    });
  });

  afterEach(() => {
    spyInstance.mockRestore();
  });

  it("should not add a statement to the database if it cannot be verified", () => {
    m.validateAndAddStatementIfMissing({
      statement: "string",
      hash_b64: "string",
      source_node_id: "string",
      verification_method: "string",
      api_key: "string",
      hidden: false,
    });
  });
});
