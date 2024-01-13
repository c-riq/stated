import React, { Fragment, useEffect, useRef } from "react";
import cytoscape from "cytoscape";
// @ts-ignore
import elk from "cytoscape-elk";

import { getSSLOVInfo, backendHost } from "../api";


cytoscape.use(elk);
cytoscape.warnings(false)
export type node = {
  data: {
    id: string;
    name: string;
    href?: string;
    backgroundColor?: string;
    size?: string;
    parent?: string;
    color?: string;
  };
};
export type edge = {
  data: {
    id: string;
    name: string;
    source: string;
    href?: string;
    target: string;
    color?: string;
  };
};
type props = {
    organisationVerifications: any[];
    personVerifications: any[];
    statement: StatementDB;
    lt850px: boolean;
}
type ssl = {domain: string, O: string, issuer_o: string, issuer_cn: string, sha256: string}
export const VerificationGraph = (props:props) => {
  const graphRef = useRef(null);
  const [sslCerts, setSslCerts] = React.useState([] as ssl[]);
  const [fetchedSslCerts, setFetchedSslCerts] = React.useState(false);

  useEffect(() => {
    const { organisationVerifications, personVerifications, statement } = props;
    let nodes:node[] = [];
    let edges:edge[] = [];
    let domains:string[] = [];
    [...organisationVerifications, ...personVerifications].forEach(
      (
        {
          verified_domain,
          foreign_domain,
          verifier_domain,
          author,
          name,
          hash_b64,
        },
        i
      ) => {
        const sourceParentId = (
          (verifier_domain) +
          ":" +
          author
        ).replace(/ /g, "_").toLowerCase();
        const targetParentId = (
          (verified_domain || foreign_domain) +
          ":" +
          name
        ).replace(/ /g, "_").toLowerCase();
        if (!nodes.map((n) => n?.data?.id).includes(sourceParentId)) {
          domains.push(verifier_domain);
          nodes.push({
            data: {
              id: sourceParentId,
              name:
                author.length > 20 ? author.substring(0, 17) + "..." : author,
            },
          });
          nodes.push({
            data: {
              id: sourceParentId + ":" + verifier_domain,
              name:
              verifier_domain.length > 20 ? verifier_domain.substring(0, 17) + "..." : verifier_domain,
              parent: sourceParentId,
              backgroundColor: "rgba(42,74,103,1)",
            },
          });
          nodes.push({
            data: {
              id: sourceParentId + ":" + author,
              name:
                author.length > 20 ? author.substring(0, 17) + "..." : author,
              parent: sourceParentId,
              backgroundColor: "rgba(42,74,103,1)",
            },
          });
        }
        if (!nodes.map((n) => n?.data?.id).includes(targetParentId)) {
          const domain = verified_domain || foreign_domain;
          domains.push(domain);
          nodes.push({
            data: {
              id: targetParentId,
              name: name.length > 20 ? name.substring(0, 17) + "..." : name,
            },
          });
          nodes.push({
            data: {
              id: targetParentId + ":" + domain,
              name:
              domain.length > 20 ? domain.substring(0, 17) + "..." : domain,
              parent: targetParentId,
              backgroundColor: "rgba(42,74,103,1)",
            },
          });
          nodes.push({
            data: {
              id: targetParentId + ":" + author,
              name:
                name.length > 20 ? name.substring(0, 17) + "..." : name,
              parent: targetParentId,
              backgroundColor: "rgba(42,74,103,1)",
            },
          });
        }
        edges.push({
          data: {
            id: sourceParentId + "-" + targetParentId,
            source: sourceParentId,
            target: targetParentId,
            name: "stated:" + hash_b64.substring(0, 5),
            href: `${backendHost}/statements/${hash_b64}`,
          },
        });
      }
    );

    const sourceParentId = (statement.domain + ":" + statement.author).replace(
      / /g,
      "_"
    ).toLowerCase();
    const targetParentId = ("statement:" + statement.hash_b64).replace(
      / /g,
      "_"
    ).toLowerCase();
    if (statement.domain && statement.author){
        if(!nodes.map((n) => n?.data?.id).includes(sourceParentId)) {
        domains.push(statement.domain);
        nodes.push({
          data: {
            id: sourceParentId,
            name:
              statement.author?.length > 20
                ? statement.author?.substring(0, 17) + "..."
                : statement.author,
          },
        });
        nodes.push({
          data: {
            id: sourceParentId + ":" + statement.domain,
            name: statement.domain.length > 20 ? statement.domain.substring(0, 17) + "..." : statement.domain,
            backgroundColor: "rgba(42,74,103,1)",
            parent: sourceParentId,
          },
        });
        nodes.push({
          data: {
            id: sourceParentId + ":" + statement.author.replace(
              / /g,
              "_"
            ).toLowerCase(),
            name:
            statement.author.length > 20 ? statement.author.substring(0, 17) + "..." : statement.author,
            backgroundColor: "rgba(42,74,103,1)",
            parent: sourceParentId,
          },
        });
      };
      if (!nodes.map((n) => n?.data?.id).includes(targetParentId)) {
        nodes.push({
          data: {
            id: targetParentId,
            name:
              statement.content?.length > 20
                ? statement.content?.substring(0, 17) + "..."
                : statement.content,
          },
        });
        nodes.push({
          data: {
            id: "author",
            name:
              statement.domain?.length > 20
                ? statement.domain?.substring(0, 17) + "..."
                : statement.domain,
                backgroundColor: "rgba(42,74,103,1)",
                parent: targetParentId,
          },
        });
        nodes.push({
          data: {
            id: "content",
            name:
              statement.content?.length > 20
                ? statement.content?.substring(0, 17) + "..."
                : statement.content,
                backgroundColor: "rgba(42,42,42,1)",
                parent: targetParentId,
          },
        });
      }
      edges.push({
        data: {
          id: sourceParentId + "-" + targetParentId,
          source: sourceParentId,
          target: targetParentId,
          name: "stated:" + statement.hash_b64?.substring(0, 5),
          href: `${backendHost}/statements/${statement.hash_b64}`,
        },
      });
    }

    [...new Set(sslCerts)].filter(d=>d?.domain && d?.O && (d.issuer_o || d.issuer_cn)).forEach((d) => {
      const issuer = d.issuer_o || d.issuer_cn
      const sourceParentId = "CA:" + issuer.replace(/ /g, "_").toLowerCase();
      const {O, domain} = d
      const baseDomain = domain.replace(/^stated.|^www./,'')
      const targetParentId = (baseDomain + ":" + O).replace(/ /g, "_").toLowerCase();
      if (nodes.map((n) => n?.data?.id).includes(targetParentId)) {
      if (!nodes.map((n) => n?.data?.id).includes(sourceParentId)) {
        nodes.push({
          data: {
            id: sourceParentId,
            name: issuer?.length > 20 ? issuer?.substring(0, 17) + "..." : issuer
          }})
        }

      edges.push({
        data: {
          id: sourceParentId + "-" + targetParentId,
          source: sourceParentId,
          target: targetParentId,
          name: "SSL:" + d.sha256?.substring(0, 5),
          href: "https://crt.sh/?sha256=" + d.sha256,
        },
      });
      }
    });

    if(!fetchedSslCerts && domains.length > 0 && domains[0]){
      const uniqueDomains = [...new Set(domains)];
      uniqueDomains.forEach((domain) => {
        getSSLOVInfo(domain, res  => {
          const newCerts = res?.result?.filter((r:PromiseSettledResult<any>)=> r.status ="fulfilled").map((r:PromiseFulfilledResult<any>)=>r.value);
          if (res?.result?.length > 0) {
            setSslCerts([...sslCerts, ...newCerts]);
          }
      },true);});
      setFetchedSslCerts(true);
    }

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
            "text-valign": "center",
            "text-halign": "center",
            backgroundColor: "data(backgroundColor)",
            color: "rgba(255,255,255,1)",
            width: "150px",
            height: "50px",
          },
        },
        {
          selector: ":parent",
          css: {
            "text-valign": "top",
            "text-halign": "center",
            // @ts-ignore
            "border-style": "none",
            "border-color": "#eeeeee",
            "background-color": "#eeeeee",
            // width: 300
          },
        },
        {
          selector: "edge",
          css: {
            "curve-style": "bezier",
            "target-arrow-shape": "triangle",
            "target-arrow-color": "#0000ee",
            label: "data(name)",
            "text-rotation": "autorotate",
            // @ts-ignore
            "text-margin-y": "-10px",
            "line-color": "#0000ee",
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
    });

    cy.userZoomingEnabled(false);
    //cy.userPanningEnabled(false);
    cy.on("click", (e) => {
      cy.userZoomingEnabled(true);
    });
    cy.on("tap", "node", (e) => {
      const node = e.target;
      if (!node.data("href")) return;
      try {
        window.open(node.data("href"));
      } catch (e) {
        window.location.href = node.data("href");
      }
    });
    cy.on("tap", "edge", (e) => {
      const edge = e.target;
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
    cy.layout({
        // @ts-ignore
        directed: true,
        name: "elk",
        rankDir: "LR",
        spacingFactor: 1.5,
        padding: 20,
        //roots: "#CA",
        elk: {
          algorithm: "layered",
          "elk.direction": "RIGHT",
          "spacing.nodeNodeBetweenLayers": 80,
        },
    }).run();
  }, [props, sslCerts, setSslCerts, fetchedSslCerts]);

  return (
    <Fragment>
      <h3>Identity Verification Graph</h3>
      <div ref={graphRef} style={{ width: "100%", height: "50vh" }}></div>
    </Fragment>
  );
};
