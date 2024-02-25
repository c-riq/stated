import {
  apiQueryString,
  queryValueToStatementType,
} from "../utils/searchQuery";
import {
  _cb,
  cb,
  dnsRes,
  domainSuggestionResponse,
  method,
  nameSuggestionResponse,
  resDB,
  validatedResponseHandler,
  vlogRes,
} from "./types";

// For demos: backendHost = 'http://'+ window.location.host
export const backendHost =
  process.env.NODE_ENV === "development" ||
  window.location.host.match(/^localhost.*/)
    ? window.location.host.match(/^localhost:3000/)
      ? "http://localhost:7766"
      : "http://" + window.location.host
    : "https://" + window.location.host;

const req = (
  method: method,
  path: string,
  body: any,
  cb: _cb,
  reject: _cb,
  host?: string,
) => {
  const url = `${host || backendHost}/api/${path}`;
  const opts = {
    headers: {
      accept: `application/json`,
      "Content-Type": "application/json",
    },
    method: method,
    ...(method === "GET" ? {} : { body: JSON.stringify(body) }),
  };
  // console.log(url, opts)
  fetch(url, opts)
    .then((res) => {
      if (res.status === 200) {
        res
          .json()
          .then((json) => {
            //console.log("json", json)
            cb(json);
          })
          .catch((error) => reject(error));
      } else {
        reject(res);
      }
    })
    .catch((error) => reject({ error }));
};
export const getStatement = (
  hash: string,
  cb: cb<StatementWithSupersedingDB | StatementWithHiddenDB>,
) => {
  if ((hash?.length || 0) < 1) {
    cb(undefined);
  }
  req(
    "GET",
    "statements/" + hash,
    {},
    (json: resDB<StatementWithSupersedingDB | StatementWithHiddenDB>) => {
      if (json?.statements?.length > 0) {
        cb(json.statements);
        window.scrollTo(0, 0);
      } else {
        cb(undefined);
      }
    },
    (e) => {
      console.log(e);
      cb(undefined);
    },
  );
};

export const getStatements = ({
  searchQuery,
  tag,
  skip,
  limit,
  domain,
  author,
  statementTypes,
  cb,
}: {
  searchQuery: string | undefined;
  tag?: string;
  limit: number;
  domain: string | undefined;
  author: string | undefined;
  skip: number;
  statementTypes: string[];
  cb: (arg0: resDB<StatementWithDetailsDB>) => void;
}) => {
  const types = statementTypes
    .map(queryValueToStatementType)
    .filter((t) => t)
    .join(",");
  const queryString = apiQueryString({
    searchQuery,
    tag,
    limit,
    skip,
    types,
    domain,
    author,
  });
  req(
    "GET",
    `statements_with_details?${queryString}`,
    {},
    (json: resDB<StatementWithDetailsDB>) => {
      cb(json);
    },
    (e) => {
      console.log(e);
      return;
    },
  );
};
export const getDomainSuggestions = (
  searchQuery: string,
  cb: (arg0: domainSuggestionResponse | undefined) => void,
) => {
  if (searchQuery.length < 1) {
    return cb(undefined);
  }
  req(
    "GET",
    searchQuery
      ? "match_domain?domain_substring=" + searchQuery
      : "match_domain",
    {},
    (json) => {
      cb(json);
    },
    (e) => {
      console.log(e);
      return;
    },
  );
};
export const getNameSuggestions = (
  searchQuery: string,
  cb: (arg0: nameSuggestionResponse | undefined) => void,
) => {
  if (searchQuery.length < 1) {
    return cb(undefined);
  }
  req(
    "GET",
    searchQuery
      ? "match_subject_name?name_substring=" + searchQuery
      : "name_substring",
    {},
    (json) => {
      cb(json);
    },
    (e) => {
      console.log(e);
      return;
    },
  );
};
export const getDomainVerifications = (
  domain: string | undefined,
  cb: cb<OrganisationVerificationDB & StatementWithSupersedingDB>,
) => {
  req(
    "GET",
    domain
      ? "organisation_verifications?domain=" + domain
      : "organisation_verifications",
    {},
    (json) => {
      if ("statements" in json) {
        cb(json.statements);
      }
    },
    (e) => {
      console.log(e);
      return;
    },
  );
};
export const getNodes = (cb: _cb) => {
  req(
    "GET",
    "nodes",
    {},
    (json) => {
      cb(json);
    },
    (e) => {
      console.log(e);
      return;
    },
  );
};
export const getSSLOVInfo = (domain: string, cb: _cb, cacheOnly?: boolean) => {
  if (!domain || domain.length < 1) {
    cb([]);
    return;
  }
  req(
    "GET",
    domain ? "ssl_ov_info?domain=" + domain : "&cache_only=" + !!cacheOnly,
    {},
    (json) => {
      cb(json);
    },
    (e) => {
      console.log(e);
      return;
    },
  );
};
export const getDNSSECInfo = (domain: string, cb: _cb) => {
  if (!domain || domain.length < 1) {
    cb({});
    return;
  }
  req(
    "GET",
    domain ? "check_dnssec?domain=" + domain : "check_dnssec",
    {},
    (json) => {
      const { validated, domain } = json;
      cb({ validated, domain });
    },
    (e) => {
      console.log(e);
      return;
    },
  );
};
export const getJoiningStatements = (
  hash: string,
  cb: cb<StatementDB & { name: string }>,
) => {
  hash &&
    req(
      "GET",
      "joining_statements?hash=" + hash,
      {},
      (json: resDB<StatementDB & { name: string }>) => {
        if ("statements" in json) {
          cb(json.statements);
        }
      },
      (e) => {
        console.log(e);
        return;
      },
    );
};
export const getVotes = (
  hash: string,
  cb: cb<VoteDB & StatementWithSupersedingDB>,
) => {
  hash &&
    req(
      "GET",
      "votes?hash=" + hash,
      {},
      (json: resDB<VoteDB & StatementWithSupersedingDB>) => {
        if ("statements" in json) {
          cb(json.statements);
        }
      },
      (e) => {
        console.log(e);
        return;
      },
    );
};
export const getResponses = (
  hash: string,
  cb: cb<StatementWithSupersedingDB>,
) => {
  hash &&
    req(
      "GET",
      "responses?hash=" + hash,
      {},
      (json: resDB<StatementWithSupersedingDB>) => {
        if ("statements" in json) {
          cb(json.statements);
        }
      },
      (e) => {
        console.log(e);
        return;
      },
    );
};
export const getDisputes = (
  hash: string,
  cb: cb<StatementWithSupersedingDB>,
) => {
  hash &&
    req(
      "GET",
      "disputes?hash=" + hash,
      {},
      (json: resDB<StatementWithSupersedingDB>) => {
        if ("statements" in json) {
          cb(json.statements);
        }
      },
      (e) => {
        console.log(e);
        return;
      },
    );
};
export const getOrganisationVerifications = (
  hash: string,
  cb: cb<OrganisationVerificationDB>,
) => {
  hash &&
    req(
      "GET",
      "organisation_verifications?hash=" + hash,
      {},
      (json: resDB<OrganisationVerificationDB>) => {
        if ("statements" in json) {
          cb(json.statements);
        }
      },
      (e) => {
        console.log(e);
        return;
      },
    );
};
export const getPersonVerifications = (
  hash: string,
  cb: cb<PersonVerificationDB>,
) => {
  hash &&
    req(
      "GET",
      "person_verifications?hash=" + hash,
      {},
      (json: resDB<PersonVerificationDB>) => {
        if ("statements" in json) {
          cb(json.statements);
        }
      },
      (e) => {
        console.log(e);
        return;
      },
    );
};
export const getTXTRecords = (
  domain: string,
  cb: (arg0: dnsRes | undefined) => void,
  reject: _cb,
) => {
  req("GET", "txt_records?domain=" + domain, {}, cb, reject);
};
export const submitStatement = (body: any, cb: _cb, reject: _cb) => {
  req("POST", "statements", body, cb, reject);
};
export const deleteStatement = (
  hash: string,
  body: any,
  cb: _cb,
  reject: _cb,
) => {
  req("DELETE", "statements/" + hash, body, cb, reject);
};
export const checkStaticStatement = (
  body: { domain: string; statement: string; hash: string },
  cb: _cb,
  reject: _cb,
) => {
  req("POST", "check_static_statement", body, cb, reject);
};
export const getVerificationLog = (
  hash: string,
  cb: (arg0: vlogRes | undefined) => void,
  reject: _cb,
  host?: string,
) => {
  host
    ? req("GET", "verification_logs?hash=" + hash, {}, cb, reject, host)
    : req("GET", "verification_logs?hash=" + hash, {}, cb, reject);
};

export const uploadPdf = (
  body: any,
  cb: validatedResponseHandler<{ sha256sum: string; filePath: string }>,
  reject: _cb,
) => {
  req(
    "POST",
    "upload_pdf",
    body,
    (json) => {
      if (json.sha256sum && json.filePath) {
        cb(json);
      } else {
        reject("upload failed");
      }
    },
    reject,
  );
};
