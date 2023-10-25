import { describe, jest, it, beforeEach, afterEach } from "@jest/globals";

import * as _m from "./statementVerification";
const m = jest.requireActual<typeof _m>("./statementVerification");

jest.mock('./database', () => ({ 
    statementExists: jest.fn(() => false),
    createStatement: jest.fn(() => ({rows: [1]})),
    updateStatement: jest.fn(() => ({rows: [1]})),
    createUnverifiedStatement: jest.fn(() => ({rows: [1]})),
}));

describe("validateAndAddStatementIfMissing", () => {
    let spyInstance1;
    let spyInstance2;
    let spyInstance3;
    let spyInstance4;

  beforeEach(() => {
    spyInstance1 = jest.spyOn(m, "validateStatementMetadata").mockReturnValue({
      content: "_",
      domain: "_",
      author: "_",
      tags: [],
      type: "_",
      content_hash_b64: "hash",
      proclaimed_publication_time: 0,
      supersededStatement: "_",
    });
    spyInstance2 = jest.spyOn(m, "getTXTEntries").mockReturnValue(new Promise(r => r(['not hash'])));
    spyInstance3 = jest.spyOn(m, "verifyViaStatedApi").mockReturnValue(new Promise(r => r(false)));
    spyInstance4 = jest.spyOn(m, "verifyViaStaticTextFile").mockReturnValue(new Promise(r => r({validated: false})));
    
  });

  afterEach(() => {
    spyInstance1.mockRestore();
    spyInstance2.mockRestore();
    spyInstance3.mockRestore();
    spyInstance4.mockRestore();
  });



  it("should throw if wrong api key is supplied", () => {
    expect(m.validateAndAddStatementIfMissing({
      statement: "_",
      hash_b64: "hash",
      source_node_id: "_",
      verification_method: "_",
      api_key: "wrong key",
      hidden: false,
    })).rejects.toThrow('could not verify statement hash on _');
  });
});
