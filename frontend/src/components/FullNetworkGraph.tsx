import React, { useEffect, useRef } from "react";
import cytoscape from "cytoscape";
import fcose from 'cytoscape-fcose'; // cola, spread

import { getNodes } from "../api";

cytoscape.use(fcose);

const sample = (arr,n) => arr.map(a => [a,Math.random()]).sort((a,b) => {return a[1] < b[1] ? -1 : 1;}).slice(0,n).map(a => a[0])

export const FullNetworkGraph = (props) => {
  console.log("VerificationGraph", props);
  const graphRef = useRef(null);
  const [p2pNodes, setP2pNodes] = React.useState([window.location.hostname]);
  const [dataFetched, setDataFetched] = React.useState(false);

  React.useEffect(() => { if(!dataFetched) {
    getNodes(({domains}) => {
        console.log("domains", domains)
      let allNodes = domains || []
      allNodes = sample(allNodes, 80)
      console.log("allNodes", allNodes, p2pNodes)
      setP2pNodes([...(new Set([...allNodes, ...p2pNodes]))]) // @ts-ignore
    })
    setDataFetched(true)
  }})

  useEffect(() => {
    let nodes = [];
    let edges = [];
    let domains = [];
    p2pNodes.forEach(
      (
        domain
      ) => {
        console.log("domain", domain)
        const sourceId = domain;
        if (!nodes.map((n) => n?.data?.id).includes(sourceId)) {
          domains.push(sourceId);
          nodes.push({
            data: {
              id: sourceId,
              name: sourceId,
              color : "rgba(42,74,103,1)"
            },
          });
        }
        for(let i = 0; i < p2pNodes.length; i++){
            const targetId = p2pNodes[i];
            if (sourceId === targetId) {
                continue
            }
            edges.push({
            data: {
                id: sourceId + "-" + targetId,
                source: sourceId,
                target: targetId,
                name: sourceId + "-" + targetId,
            },
            });
         }
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
            "curve-style": "linear",
            "target-arrow-shape": "triangle",
           // label: "data(name)",
            "text-rotation": "autorotate",
            "color": "data(color)",
            "text-margin-y": "-10px",
            "line-color": "data(color)",
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
        directed: false,
        name: "fcose",
        quality: "proof",
        nodeRepulsion: node => 450000,
        minDist: 20,
        centerGraph: true,
        alignment: "center",
        padding: 50,
      },
    });
    cy.on("tap", "node", function () {
      if (!this.data("href")) return;
      try {
        window.open(this.data("href"));
      } catch (e) {
        window.location.href = this.data("href");
      }
    });
    cy.on("tap", "edge", function () {
      if (!this.data("href")) return;
      try {
        window.open(this.data("href"));
      } catch (e) {
        window.location.href = this.data("href");
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
