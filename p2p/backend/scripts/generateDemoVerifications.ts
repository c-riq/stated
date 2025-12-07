/* 
disable own domain check in backend API key verification
run in root folder with
HOST=localhost PORT=7766 ts-node backend/scripts/generateObservations.ts
*/
import {
  buildOrganisationVerificationContent,
  buildStatement,
  buildVoteContent,
  minPeopleCountToRange,
  parsePoll,
  parseStatement,
} from "../statementFormats";

import { sha256Node as sha256 } from "stated-protocol-parser";

import { legalForms } from "../constants/legalForms";

import { readCSV, submitStatement } from "./shared";

const sample = (arr, n) =>
  arr
    .map((a) => [a, Math.random()])
    .sort((a, b) => {
      return a[1] < b[1] ? -1 : 1;
    })
    .slice(0, n)
    .map((a) => a[0]);
const shuffle = (str) => [...str].sort(() => Math.random() - 0.5).join("");

const apiKey = process.env.API_KEY || "XXX";

const verificationsDemo = [
  {
    name: "AMAZON.COM, INC.",
    CIK: "1018724",
    website_domain: "amazon.com",
    city: "Seattle",
    province: "Washington",
    country: "United States of America (the)",
    employees_min: 100000,
    serial_number: "91-1646860",
    confidence: 0.9,
    undefined: "",

    author: "Apple Inc.",
    author_domain: "apple.com",
    author_representative: "Tim Cook",
  },
  {
    name: "American Express Company",
    CIK: "4962",
    website_domain: "americanexpress.com",
    city: "New York",
    province: "New York",
    country: "United States of America (the)",
    employees_min: 10000,
    serial_number: "13-4922250",
    confidence: 0.9,

    author: "Apple Inc.",
    author_domain: "apple.com",
    author_representative: "Tim Cook",
  },

  {
    name: "Tesla, Inc.",
    CIK: "1318605",
    location_untrusted_source: "Austin, Texas",
    website_domain: "tesla.com",
    city: "Austin",
    province: "Texas",
    country: "United States of America (the)",
    employees_min: 100000,
    serial_number: "91-2197729",
    confidence: 0.9,

    author: "American Express Company",
    author_domain: "americanexpress.com",
    author_representative: "Stephen J. Squeri",
  },

  {
    name: "Tesla, Inc.",
    CIK: "1318605",
    location_untrusted_source: "Austin, Texas",
    website_domain: "tesla.com",
    city: "Austin",
    province: "Texas",
    country: "United States of America (the)",
    employees_min: 100000,
    serial_number: "91-2197729",
    confidence: 0.9,

    author: "AMAZON.COM, INC.",
    author_domain: "amazon.com",
    author_representative: "Andrew R. Jassy",
  },

  {
    name: "WALMART INC.",
    CIK: "104169",
    website_domain: "walmart.com",
    city: "Bentonville",
    province: "Arkansas",
    country: "United States of America (the)",
    employees_min: 100000,
    serial_number: "71-0415188",
    confidence: 0.9,

    author: "Tesla, Inc.",
    author_domain: "tesla.com",
    author_representative: "Elon Musk",
  },
];

const disputesDemo = [{}];

const statementTags = ["AI Safety", "AI Governance"];
const statementContent =
  "We will not pursue research in any Artificial General Intelligence and we will boycott any company that does.";

const statementsDemo = [
  {
    author: "Tesla, Inc.",
    author_domain: "tesla.com",
    author_representative: "Elon Musk",
  },
  {
    author: "AMAZON.COM, INC.",
    author_domain: "amazon.com",
    author_representative: "Andrew R. Jassy",
  },
  {
    author: "Apple Inc.",
    author_domain: "apple.com",
    author_representative: "Tim Cook",
  },
  {
    author: "American Express Company",
    author_domain: "americanexpress.com",
    author_representative: "Stephen J. Squeri",
  },
  {
    author: "WALMART INC.",
    author_domain: "walmart.com",
    author_representative: "Douglas McMillon",
  },
];

const fileName = "sp500_companies.csv";
//const fileName = "dax_index_companies.csv";
const realCompanies = readCSV(fileName);

//console.log(verificationsDemo);
async () => {
  for (const i of verificationsDemo) {
    // company,instrument,trading_symbol,isin,index,date,website,ssl_ov_verification,
    // ov_of_subsidiary,country,province,city,serial_number,vat_id,confidence
    const {
      name,
      website_domain,
      country,
      province,
      city,
      serial_number,
      employees_min,
      confidence,

      author,
      author_domain,
      author_representative,
    } = i;
    if (!name || !website_domain || !country || !province || !city) {
      continue;
    }
    if (city.match(/\|/g)) {
      continue;
    }
    console.log("add");
    // @ts-ignore
    const verification = buildOrganisationVerificationContent({
      name,
      domain: website_domain,
      country,
      province,
      city,
      serialNumber: serial_number,
      legalForm: legalForms.corporation,
      confidence: confidence,
      employeeCount: employees_min ? minPeopleCountToRange(employees_min) : undefined,
      reliabilityPolicy:
        "https://stated.rixdata.net/statements/MjcqvZJs_CaHw-7Eh_zbUSPFxCLqVY1EeXn9yGm_ads",
    });
    if (!verification) {
      console.log("no verification generated");
      continue;
    }
    const statement = buildStatement({
      domain: author_domain,
      author,
      representative: author_representative,
      time: new Date(),
      content: verification,
    });
    const data = {
      statement,
      hash: sha256(statement),
      api_key: apiKey,
    };
    submitStatement( {data, host: 'localhost', useHttps: false, callback: (res) => {
      console.log(res);
    }});
    //await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}; //();

async () => {
  for (const i of statementsDemo) {
    // company,instrument,trading_symbol,isin,index,date,website,ssl_ov_verification,
    // ov_of_subsidiary,country,province,city,serial_number,vat_id,confidence
    const {
      author,
      author_domain,
      author_representative,
      // content,
      // tags
    } = i;
    if (!author) {
      continue;
    }
    console.log("add");
    const statement = buildStatement({
      domain: author_domain,
      author,
      representative: author_representative,
      tags: statementTags,
      time: new Date(),
      content: statementContent,
    });
    const data = {
      statement,
      hash: sha256(statement),
      api_key: apiKey,
    };
    submitStatement( {data, host: 'localhost', useHttps: false, callback: (res) => {
      console.log(res);
    }});
    //await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}; //();

const pollStatement = `Publishing domain: lmu.de
Author: Ludwig-Maximilians-Universität München
Time: Thu, 31 Aug 2023 10:34:18 GMT
Tags: AI Safety, AI Governance
Statement content: 
	Type: Poll
	Legal entity scope: corporation
	The decision is finalized when the following nodes agree: lmu.de
	Voting deadline: Sat, 30 Sep 2023 11:29:38 GMT
	Poll: Should the open-source publication of the most powerful AI systems prohibited unless particularly rigorous safety and ethics requirements are met, akin to constraints on the publication of “dual-use research of concern” in biological sciences and nuclear domains.
	Option 1: Yes
	Option 2: No
`;
(async () => {
  const pollBody = {
    statement: pollStatement,
    hash: sha256(pollStatement),
    api_key: apiKey,
  };
  await submitStatement({data: pollBody, host: 'localhost', useHttps: false, callback: (res) => {
    console.log(res);
  }});
})//();


const createP2PVerification = async (company1, company2) => {
  const { name: author, website_domain: author_domain } = company1;
  const {
    name,
    english_name,
    website_domain,
    country,
    province,
    city,
    serial_number,
    employees_min,
    confidence,
    employer_identification_number,
  } = company2;
  if (!author || !name || !website_domain || !country || !province || !city || province.match(/\|/) || city.match(/\|/)) {
    console.log("rejected verification")
    return;
  }
  console.log("add");
  // @ts-ignore
  const verification = buildOrganisationVerificationContent({
    name,
    englishName: english_name,
    domain: website_domain,
    country,
    province,
    city,
    serialNumber: serial_number || employer_identification_number,
    legalForm: legalForms.corporation,
    confidence: confidence,
    employeeCount: employees_min && minPeopleCountToRange(employees_min),
    reliabilityPolicy: `https://stated.${author_domain}/statements/${shuffle(
      "MjcqvZJs_CaHw-7Eh_zbUSPFxCLqVY1EeXn9yGm_ads"
    )}`,
  });
  const verificationStatement = buildStatement({
    domain: author_domain,
    author,
    time: new Date(),
    content: verification,
  });
  const verificationBody = {
    statement: verificationStatement,
    hash: sha256(verificationStatement),
    api_key: apiKey,
  };
  await submitStatement({data: verificationBody, host: 'localhost', useHttps: false, callback: (res) => {
    console.log(res);
  }});
};

const createExampleStatement = (company) => {
  const { name, website_domain } = company;
  const statement = buildStatement({
    domain: website_domain,
    author: name,
    representative: "John Doe (CEO)",
    tags: statementTags,
    time: new Date(),
    content: statementContent,
  });
  const statementBody = {
    statement: statement,
    hash: sha256(statement),
    api_key: apiKey,
  };
  submitStatement({data: statementBody, host: 'localhost', useHttps: false, callback: (res) => {
    console.log(res);
  }});
};

const createExampleVote = (company) => {
  const { name, website_domain } = company;
  // const voteContent = buildVoteContent({
  //   pollHash: "UML4k1qMwqxvQcJNNKq7dWsTQo4wLT8-Iz3RkfpF1wE",
  //   poll: "Should an intergovernmental organizations be formed, akin to the International Atomic Energy Agency (IAEA), to promote peaceful uses of AI while mitigating risk and ensuring guardrails are enforced.",
  //   vote: Math.random() > 0.05 ? "Yes" : "No",
  // });
  const pollContent = parseStatement({statement: pollStatement}).content;
  console.log(pollContent);
  const voteContent = buildVoteContent({
    pollHash: sha256(pollStatement),
    poll: parsePoll(pollContent).poll,
    vote: Math.random() > 0.12 ? "Yes" : "No",
  });
  const voteStatement = buildStatement({
    domain: website_domain,
    author: name,
    representative: "John Doe (CEO)",
    tags: statementTags,
    time: new Date(),
    content: voteContent,
  });
  const voteBody = {
    statement: voteStatement,
    hash: sha256(voteStatement),
    api_key: apiKey,
  };
  submitStatement({data: voteBody, host: 'localhost', useHttps: false, callback: (res) => {
    console.log(res);
  }});
};

const randomSubset1 = sample(realCompanies, 400);
const randomSubset2 = sample(realCompanies, 400);
const randomSubset3 = sample(realCompanies, 20);
(async () => {
  await randomSubset1.forEach(async (v, i) => {
    //createP2PVerification(v, randomSubset2[i]);
    // createP2PVerification(v, randomSubset3[i]);
    //createExampleStatement(randomSubset2[i]);
     createExampleVote(randomSubset2[i]);
    await new Promise((resolve) => setTimeout(resolve, 200));
  });
})();
