import React, { Fragment, useEffect, useRef } from "react";
import cytoscape from "cytoscape";
import elk from "cytoscape-elk";

cytoscape.use(elk);

export const VerificationGraph = props => {
  const graphRef = useRef(null);

  useEffect(() => {
    const { organisationVerifications, personVerifications, statement } = props;
    let nodes = [];
    let edges = [];
    [...organisationVerifications,
      ...personVerifications].forEach(({verified_domain, foreign_domain, verifier_domain, author, name, hash_b64}, i) => {
      const sourceParentId = ((verifier_domain||foreign_domain)+':'+author).replace(/ /g, '_')
      const targetParentId = ((verified_domain||foreign_domain)+':'+name).replace(/ /g, '_')
      if (!(nodes.map(n=>n.id).includes(sourceParentId))) {
        nodes.push({ data: { id: sourceParentId, name: 
          (author.length > 20 ? author.substring(0,17) + '...' : author) } });
      }
      if (!(nodes.map(n=>n.id).includes(targetParentId))) {
        nodes.push({ data: { id: targetParentId, name: 
          (name.length > 20 ? name.substring(0,17) + '...' : name) } });
      }
      edges.push({
        data: {
          id: sourceParentId + "-" + targetParentId,
          source: sourceParentId,
          target: targetParentId,
          name: 'stated:' + hash_b64.substring(0, 5),
          href: "http://localhost:3000/statement/" + hash_b64,
        },
      });
    });

    const sourceParentId = ((statement.domain)+':'+statement.author).replace(/ /g, '_')
    const targetParentId = ('statement:'+statement.content).replace(/ /g, '_')
    if (!(nodes.map(n=>n.id).includes(sourceParentId))) {
      nodes.push({ data: { id: sourceParentId, name: 
        (statement.author?.length > 20 ? statement.author?.substring(0,17) + '...' : statement.author) } });
    }
    if (!(nodes.map(n=>n.id).includes(targetParentId))) {
      nodes.push({ data: { id: targetParentId, name: 
        (statement.content?.length > 20 ? statement.content?.substring(0,17) + '...' : statement.content) } });
    }
    edges.push({
      data: {
        id: sourceParentId + "-" + targetParentId,
        source: sourceParentId,
        target: targetParentId,
        name: 'stated:' + statement.hash_b64?.substring(0, 5),
        href: "http://localhost:3000/statement/" + statement.hash_b64,
      },
    });
    console.log(nodes, edges);
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
        {
          selector: 'loop',
          style: {            
            'loop-direction': '180deg', 
            'loop-sweep': '200deg',
            'target-endpoint': '-90deg',
            'source-endpoint': '90deg', 
            'control-point-step-size': 160,
          }
        },
      ],
      elements: {
        nodes: nodes,
        edges: edges,
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
    cy.on('mouseover', 'edge', () => document.body.setAttribute('style', 'cursor: pointer;') );
    cy.on('mouseout', 'edge', () => document.body.setAttribute('style', 'cursor: auto;') );
  }, [props]);
  return (
    <Fragment>
      <h2>Verification Graph</h2>
      <div ref={graphRef} style={{ width: "100%", height: "30vh" }}></div>
    </Fragment>
  );
};
