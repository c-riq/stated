import React, { useEffect, useRef } from "react";
import cytoscape from "cytoscape";
import fcose from 'cytoscape-fcose'; // cola, spread
import { legalForms } from "../constants/legalForms";
import { peopleCountBuckets, parseOrganisationVerification } from "../statementFormats";

import { backendHost, getDomainVerifications } from "../api";
import { node, edge } from "./VerificationGraph";

cytoscape.use(fcose);

const sample = (arr:any[],n:number) => arr.map(a => [a,Math.random()]).sort((a,b) => {return a[1] < b[1] ? -1 : 1;}).slice(0,n).map(a => a[0])

export const FullVerificationGraph = () => {
  const graphRef = useRef(null);
  const [organisationVerifications, setOrganisationVerifications] = React.useState([] as (StatementWithSupersedingDB & OrganisationVerificationDB)[]);
  const [dataFetched, setDataFetched] = React.useState(false);

  React.useEffect(() => { if(!dataFetched) {
    getDomainVerifications(undefined, (statements) => {
      let verifications = statements as (StatementWithSupersedingDB & OrganisationVerificationDB)[]
      verifications = verifications!.filter(v => !!v.verified_domain)
      verifications = sample(verifications, 8000)
      setOrganisationVerifications(verifications)
    })
    setDataFetched(true)
  }})

  useEffect(() => {
    let nodes: node[] = [];
    let edges: edge[] = [];
    let domains = [];
    organisationVerifications.forEach(
      (
        {
          verified_domain,
          foreign_domain,
          verifier_domain,
          author,
          name,
          hash_b64,
          statement_hash,
          legal_entity_type,
          content
        },
        i
      ) => {
        const parsedOrganisationVerification = parseOrganisationVerification(content)
        if(!author) { author = author || "author" }
        if(!name) { name = "name" }
        if(!verified_domain) { verified_domain = "verified_domain" }
        if(!verifier_domain) { verifier_domain = "verifier_domain" }
        if(!hash_b64) { hash_b64 = statement_hash || "hash_b64" }
        //console.log("verifier_domain", verifier_domain, "author", author, "verified_domain", verified_domain, "name", name, "hash_b64", hash_b64, "statement_hash", statement_hash)
        const sourceId = (
          (verifier_domain) +
          ":" +
          author
        ).replace(/ /g, "_").toLowerCase();
        const targetId = (
          (verified_domain || foreign_domain) +
          ":" +
          name
        ).replace(/ /g, "_").toLowerCase();
        if (!nodes.map((n) => n?.data?.id).includes(sourceId)) {
          domains.push(verifier_domain);
          nodes.push({
            data: {
              id: sourceId,
              name:
                (!author) ? "author" : author.length > 17 ? author.substring(0, 15) + "..." : author,
              color :  "rgba(42,74,103,1)" // "rgba(147,159,173,1)" // "rgba(200,42,42,1)"
            },
          });
        }
        if (!nodes.map((n) => n?.data?.id).includes(targetId)) {
          const domain = verified_domain || foreign_domain;
          domains.push(domain);
          nodes.push({
            data: {
              id: targetId,
              name: (name.length > 20 ? name.substring(0, 17) + "..." : name) + "\n" + domain,
              href: `${backendHost}/statements/${hash_b64}`,
              color: 
              legal_entity_type === legalForms.corporation ? "rgba(42,74,103,1)" : (
              legal_entity_type === legalForms.local_government ? "rgba(42,100,103,1)" : (
              legal_entity_type === legalForms.foreign_affairs_ministry ? "rgba(200,42,42,1)" : (
                "rgba(42,42,42,1)" ))),
              size: 
              parsedOrganisationVerification.employeeCount === peopleCountBuckets["100000"] ? "50px" : "30px"
            },
          });
        }
        edges.push({
          data: {
            id: sourceId + "-" + targetId,
            source: sourceId,
            target: targetId,
            name: "stated:" + hash_b64.substring(0, 5),
            href: `${backendHost}/statements/${hash_b64}`,
            color: (parsedOrganisationVerification && (parsedOrganisationVerification.confidence?? 0 >= 0.8)) ? "rgb(150,150,150)" : "rgb(200,200,200)",
          },
        });
      }
    );
    const cy = cytoscape({
      container: graphRef.current,
      boxSelectionEnabled: false,

      style: [
        {
          selector: "node",
          style: {
            shape: "round-rectangle",
            content: "data(name)",
            //label: "data(id)",
            "text-max-width": "100px",
            "text-wrap": "wrap",
            "font-size": "10px",
            "text-valign": "center",
            "text-halign": "center",
            color: "rgba(255,255,255,1)",
            backgroundColor: "data(color)",
            height: "data(size)",
            width: "100px",
          },
        },
        {
          selector: "edge",
          css: {
            "curve-style": "bezier",
            "target-arrow-shape": "triangle",
            label: "data(name)",
            "text-rotation": "autorotate",
            "color": "data(color)",
            // @ts-ignore
            "text-margin-y": "-10px",
            "line-color": "data(color)",
            // @ts-ignore
            "line-style": "data(style)",
          },
        },
        {
          selector: "loop",
          style: {
            "loop-direction": "180deg",
            "loop-sweep": "200deg",
            "target-endpoint": "-90deg",
            "source-endpoint": "90deg",
            "control-point-step-size": 160,
          },
        },
      ],
      elements: {
        nodes: nodes,
        edges: edges,
      },
      layout: {
        // @ts-ignore
        directed: true,
        name: "fcose",
        quality: "proof",
        nodeRepulsion: () => 450000,
        minDist: 20,
        centerGraph: true,
        alignment: "center",
        padding: 50,
      },
    });
    const embeddedInIframe = window.self !== window.top;
    cy.userZoomingEnabled(embeddedInIframe ? false : true);
    cy.on("click", (e) => {
      cy.userZoomingEnabled(true);
    });
    cy.on("tap", "node", function (e) {
      let node = e.target;
      if (!node.data("href")) return;
      try {
        window.open(node.data("href"));
      } catch (e) {
        window.location.href = node.data("href");
      }
    });
    cy.on("tap", "edge", function (e) {
      let edge = e.target;
      if (!edge.data("href")) return;
      try {
        window.open(edge.data("href"));
      } catch (e) {
        window.location.href = edge.data("href");
      }
    });
    cy.on("mouseover", "edge", () =>
      document.body.setAttribute("style", "cursor: pointer;")
    );
    cy.on("mouseout", "edge", () =>
      document.body.setAttribute("style", "cursor: auto;")
    );
    cy.on("mouseover", "node", () =>
      document.body.setAttribute("style", "cursor: pointer;")
    );
    cy.on("mouseout", "node", () =>
      document.body.setAttribute("style", "cursor: auto;")
    );

    //cy.fit(/*eles, padding*/); 
  });
  return (
      <div ref={graphRef} style={{ width: "100vw", height: "100vh", textAlign: "start" }}></div>
  );
};
