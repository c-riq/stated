import React, { useEffect, useRef } from "react";
import cytoscape from "cytoscape";
import fcose from 'cytoscape-fcose'; // cola, spread

import { getNodes } from "../api";
import { node, edge } from "./VerificationGraph";

cytoscape.use(fcose);

const sample = (arr: any[],n:number) => arr.map(a => [a,Math.random()]).sort((a,b) => {return a[1] < b[1] ? -1 : 1;}).slice(0,n).map(a => a[0])

export const FullNetworkGraph = () => {
  const graphRef = useRef(null);
  const [p2pNodes, setP2pNodes] = React.useState([{
    domain: window.location.hostname, last_seen: new Date(), ip: undefined, fingerprint: undefined
  }]);
  const [dataFetched, setDataFetched] = React.useState(false);

  React.useEffect(() => { if(!dataFetched) {
    getNodes(({result}) => {
      setP2pNodes([...(new Set([...result, ...p2pNodes]))]) // @ts-ignore
    })
    setDataFetched(true)
  }})

  useEffect(() => {
    let nodes:node[] = [];
    let edges:edge[] = [];
    let domains = [];
    p2pNodes.forEach(
      (
        {domain, ip=undefined, last_seen=undefined, fingerprint=undefined}
      ) => {
        const sourceId = domain;
        const daysSinceLastSeen = last_seen ? ((new Date()).getTime() - (new Date(last_seen)).getTime()) / (1000*60*60*24) : 1e9
        if (!nodes.map((n) => n?.data?.id).includes(sourceId)) {
          domains.push(sourceId);
          nodes.push({
            data: {
              id: sourceId,
              name: sourceId + (ip ? '\nip: ' + ip : '') + '\n ssl fingerprint: ' + (fingerprint ? (fingerprint as string).substring(0,7) + '...' : 'unknown')
              + (daysSinceLastSeen > 3 ? '\nnot seen for >3 days' : ''),
              color : daysSinceLastSeen > 3 ? "rgb(200,50,50)" : "rgba(42,74,103,1)",
            },
          });
        }
      }
    );
    const sourceId = window.location.hostname
    for(let i = 0; i < p2pNodes.length; i++){
      const targetId = p2pNodes[i].domain;
      if (targetId === sourceId) continue;
      const last_seen = p2pNodes[i].last_seen;
      const daysSinceLastSeen = last_seen ? ((new Date()).getTime() - (new Date(last_seen)).getTime()) / (1000*60*60*24) : 1e9
      edges.push({
      data: {
          id: sourceId + "-" + targetId,
          source: sourceId,
          target: targetId,
          name: sourceId + "-" + targetId,
          color: daysSinceLastSeen > 3 ? "rgb(180,180,180)" : "rgb(40,40,40)",
      },
      });
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
            "font-size": "10px",
            "text-valign": "center",
            "text-halign": "center",
            color: "rgba(255,255,255,1)",
            backgroundColor: "data(color)",
            height: "70px",
            width: "100px",
          },
        },
        {
          selector: "edge",
          css: {
            // @ts-ignore
            "curve-style": "linear",
            "target-arrow-shape": "triangle",
           // label: "data(name)",
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
        directed: false,
        name: "fcose",
        quality: "proof",
        nodeRepulsion: () => 450000,
        minDist: 20,
        centerGraph: true,
        alignment: "center",
        padding: 50,
      },
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
