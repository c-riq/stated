import React, { Fragment, useEffect, useRef } from "react";
import cytoscape from "cytoscape";
import elk from "cytoscape-elk";

cytoscape.use(elk);

export const VerificationGraph = () => {
  const graphRef = useRef(null);

  const drawGraph = () => {
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
            "background-color": "rgba(42,74,103,1)",
            "color": "rgba(255,255,255,1)",
            width: "150px",
            height: "50px",
          },
        },
        {
          selector: ":parent",
          css: {
            "text-valign": "top",
            "text-halign": "center",
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
            label: "data(name)",
            "text-rotation": "autorotate",
            "text-margin-y": "-10px",
            "color": "#0000ee",
            'line-style': 'data(style)'
          },
        },
      ],
      elements: {
        nodes: [
          { data: { id: "root", name: "", shape: "circle" }, position: { x: 0, y: 0 } },
          { data: { id: "CA", name: "" } },
          { data: { id: "Sectigo", name: "Sectigo Limited" , parent: "CA" }},
          { data: { id: "Certificate Authority", name: "Certificate Authority" , parent: "CA" }},
          {
            data: { id: "SSL" , name: "SSL OV certificate"},
            href: "https://crt.sh/?sha256=2884EC1DE425003B57CFECF80CEE32865E6C9351B57F816F5FA7CC43FE5FA99D",
          },
          { data: { id: "Statement", name: "Statement" } },
          {
            data: { id: "Rix Data NL B.V.", name: "Rix Data NL B.V.", parent: "SSL" },
          },
          {
            data: { id: "location", name: "North-Holland, NL", parent: "SSL" },
          },
          {
            data: { id: "stated.rixdata.nl", name: "stated.rixdata.nl", parent: "SSL" },
          },
          {
            data: { id: "author", name: "Rix Data NL B.V.", parent: "Statement" },
          },
          {
            data: { id: "Statement Content", name: "Statement Content", parent: "Statement" },
          },
        ],
        edges: [
          {
            data: {
              id: "1",
              source: "root",
              target: "CA",
              href: "https://crt.sh/?caid=105487",
              name: "Root cert lists",
              style: "dashed"
            },
          },
          {
            data: {
              id: "2",
              source: "CA",
              target: "SSL",
              href: "https://crt.sh/?q=2884EC1DE425003B57CFECF80CEE32865E6C9351B57F816F5FA7CC43FE5FA99D",
              name: "SSL OV"
            },
          },
          {
            data: { id: "7", source: "SSL", target: "Statement",
            href: "https://stated.rixdata.net/statement/650071d889ae31890bdafc2488ea7fd58096c09c4d3d400aea4d5e70b5ef8c19", name:"stated API" },
          },
          {
            data: { id: "8", source: "stated.rixdata.nl", target: "Statement",
            href: "https://dns.google/query?name=stated.rixdata.net&rr_type=TXT&ecs=", name:"stated DNS" },
          },
        //   {
        //     data: { id: "9", source: "SSL", target: "Statement",
        //     href: "https://dns.google/query?name=stated.rixdata.net&rr_type=TXT&ecs=", name:"stated static" },
        //   },
        ],
      },
      layout: {
        directed: true,
        name: "elk",
        rankDir: "LR",
        spacingFactor: 1.5,
        padding: 20,
        //roots: "#CA",
        elk: {
          algorithm: "layered",
          "elk.direction": "RIGHT",
          'spacing.nodeNodeBetweenLayers': 80,
        },
      },
    });

    cy.userZoomingEnabled(false);
    //cy.userPanningEnabled(false);
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
    cy.on('mouseover', 'edge', () => document.body.setAttribute('style', 'cursor:' + 'pointer'  + ';') );
    cy.on('mouseout', 'edge', () => document.body.setAttribute('style', 'cursor:' + 'auto'  + ';') );
  };

  useEffect(() => {
    drawGraph();
  }, []);

  return (
    <Fragment>
      <h2>Verification Graph</h2>
      <div ref={graphRef} style={{ width: "100%", height: "30vh" }}></div>
    </Fragment>
  );
};
