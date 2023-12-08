import { describe, jest, it, beforeEach, afterEach } from "@jest/globals";

jest.mock('./database', () => ({
  statementExists: jest.fn(() => false),
  createStatement: jest.fn(() => ({rows: [1]})),
  updateStatement: jest.fn(() => ({rows: [1]})),
  createUnverifiedStatement: jest.fn(() => ({rows: [1]})),
  updateUnverifiedStatement: jest.fn(() => ({rows: [1]})),
  createHiddenStatement: jest.fn(() => ({rows: [1]})),
}));

import * as _m from "./statementVerification";
const m = jest.requireActual<typeof _m>("./statementVerification");

import {createUnverifiedStatement, createStatement} from "./database";

describe("validateAndAddStatementIfMissing", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
    jest.spyOn(m, "validateStatementMetadata").mockReturnValue({
      content: "_",
      domain: "_",
      author: "_",
      tags: [],
      type: "_",
      content_hash_b64: "hash",
      proclaimed_publication_time: 0,
      supersededStatement: "_",
    });

  it("should throw if wrong api key is supplied", () => {
    jest.spyOn(m, "getTXTEntries").mockReturnValue(new Promise(r => r(['not hash'])));
    jest.spyOn(m, "verifyViaStatedApi").mockReturnValue(new Promise(r => r(false)));
    jest.spyOn(m, "verifyViaStaticTextFile").mockReturnValue(new Promise(r => r({validated: false})));
    const withWrongApiKey = {
      statement: "_",
      hash_b64: "hash",
      source_node_id: "_",
      verification_method: "_",
      api_key: "wrong key",
      hidden: false,
    }
    expect(m.validateAndAddStatementIfMissing(withWrongApiKey)).rejects.toThrow('could not verify statement hash on _');
    expect(createUnverifiedStatement).toHaveBeenCalledTimes(0);
  });

  it("should create an unverified statement if verifications fail and no api key supplied", async () => {
    jest.spyOn(m, "getTXTEntries").mockReturnValue(new Promise(r => r(['not hash'])));
    jest.spyOn(m, "verifyViaStatedApi").mockReturnValue(new Promise(r => r(false)));
    jest.spyOn(m, "verifyViaStaticTextFile").mockReturnValue(new Promise(r => r({validated: false})));
    const result = await m.validateAndAddStatementIfMissing({
      statement: "_",
      hash_b64: "hash",
      source_node_id: "_",
      verification_method: "_",
      hidden: false,
    })
    expect(result).toStrictEqual({"existsOrCreated": true});
    expect(createUnverifiedStatement).toHaveBeenCalledTimes(1);
  });

  it("should create a statement if DNS validation succeeds", async () => {
    jest.spyOn(m, "getTXTEntries").mockReturnValue(new Promise(r => r(['hash'])));
    jest.spyOn(m, "verifyViaStatedApi").mockReturnValue(new Promise(r => r(false)));
    jest.spyOn(m, "verifyViaStaticTextFile").mockReturnValue(new Promise(r => r({validated: false})));
    const result = await m.validateAndAddStatementIfMissing({
      statement: "_",
      hash_b64: "hash",
      source_node_id: "_",
      verification_method: "_",
      hidden: false,
    })
    expect(result).toStrictEqual({"existsOrCreated": true});
    expect(createStatement).toHaveBeenCalledTimes(1);
    expect(createUnverifiedStatement).toHaveBeenCalledTimes(0);
  });

  it("should create a statement if api validation succeeds", async () => {
    jest.spyOn(m, "getTXTEntries").mockReturnValue(new Promise(r => r(['not hash'])));
    jest.spyOn(m, "verifyViaStatedApi").mockReturnValue(new Promise(r => r(true)));
    jest.spyOn(m, "verifyViaStaticTextFile").mockReturnValue(new Promise(r => r({validated: false})));
    const result = await m.validateAndAddStatementIfMissing({
      statement: "_",
      hash_b64: "hash",
      source_node_id: "_",
      verification_method: "_",
      hidden: false,
    })
    expect(result).toStrictEqual({"existsOrCreated": true});
    expect(createStatement).toHaveBeenCalledTimes(1);
  });

  it("should create a statement if text file validation succeeds", async () => {
    jest.spyOn(m, "getTXTEntries").mockReturnValue(new Promise(r => r(['not hash'])));
    jest.spyOn(m, "verifyViaStatedApi").mockReturnValue(new Promise(r => r(false)));
    jest.spyOn(m, "verifyViaStaticTextFile").mockReturnValue(new Promise(r => r({validated: true})));
    const result = await m.validateAndAddStatementIfMissing({
      statement: "_",
      hash_b64: "hash",
      source_node_id: "_",
      verification_method: "_",
      hidden: false,
    })
    expect(result).toStrictEqual({"existsOrCreated": true});
    expect(createStatement).toHaveBeenCalledTimes(1);
  });

});
