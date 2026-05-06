// Graph Algorithm Visualizer.
// The graph is undirected and stored with an adjacency list.

const SVG_NS = "http://www.w3.org/2000/svg";
const NODE_RADIUS = 23;
const ANIMATION_DELAY_MS = 520;

const graphCanvas = document.querySelector("#graph-canvas");
const algorithmSelect = document.querySelector("#algorithm-select");
const toolButtons = document.querySelectorAll(".tool-button");
const visualizeButton = document.querySelector("#visualize-button");
const exampleButton = document.querySelector("#example-button");
const clearButton = document.querySelector("#clear-button");
const statusMessage = document.querySelector("#status-message");
const graphSummary = document.querySelector("#graph-summary");
const startTargetSummary = document.querySelector("#start-target-summary");
const resultOutput = document.querySelector("#result-output");

const controls = [algorithmSelect, visualizeButton, exampleButton, clearButton, ...toolButtons];

let nodes = [];
let edges = [];
let adjacencyList = {};
let activeTool = "add-node";
let selectedEdgeNodeId = null;
let startNodeId = null;
let targetNodeId = null;
let visitedNodeIds = new Set();
let pathNodeIds = new Set();
let pathEdgeKeys = new Set();
let isAnimating = false;
let nextNodeNumber = 1;

function addNode(x, y) {
  clearHighlights();
  resultOutput.textContent = "No algorithm run yet.";
  const id = `N${nextNodeNumber}`;
  nextNodeNumber += 1;

  nodes.push({ id, x, y });
  adjacencyList[id] = [];
  renderGraph();
  setMessage(`${id} added.`);
}

function addEdge(firstNodeId, secondNodeId) {
  if (firstNodeId === secondNodeId) {
    setMessage("Choose two different nodes for an edge.");
    return;
  }

  if (hasEdge(firstNodeId, secondNodeId)) {
    setMessage("That edge already exists.");
    return;
  }

  clearHighlights();
  resultOutput.textContent = "No algorithm run yet.";
  edges.push({ from: firstNodeId, to: secondNodeId });
  adjacencyList[firstNodeId].push(secondNodeId);
  adjacencyList[secondNodeId].push(firstNodeId);
  renderGraph();
  setMessage(`Edge added: ${firstNodeId} - ${secondNodeId}.`);
}

function renderGraph() {
  graphCanvas.innerHTML = "";

  if (nodes.length === 0) {
    const emptyText = document.createElementNS(SVG_NS, "text");

    emptyText.setAttribute("class", "graph-empty-text");
    emptyText.setAttribute("x", "50%");
    emptyText.setAttribute("y", "50%");
    emptyText.textContent = "Click empty space to add nodes.";
    graphCanvas.appendChild(emptyText);
    updateSummaries();
    return;
  }

  edges.forEach((edge) => {
    const firstNode = getNodeById(edge.from);
    const secondNode = getNodeById(edge.to);
    const line = document.createElementNS(SVG_NS, "line");

    line.setAttribute("x1", firstNode.x);
    line.setAttribute("y1", firstNode.y);
    line.setAttribute("x2", secondNode.x);
    line.setAttribute("y2", secondNode.y);
    line.setAttribute("class", getEdgeClass(edge.from, edge.to));
    graphCanvas.appendChild(line);
  });

  nodes.forEach((node) => {
    const group = document.createElementNS(SVG_NS, "g");
    const circle = document.createElementNS(SVG_NS, "circle");
    const label = document.createElementNS(SVG_NS, "text");

    group.setAttribute("class", getNodeClass(node.id));
    group.dataset.nodeId = node.id;

    circle.setAttribute("class", "node-circle");
    circle.setAttribute("cx", node.x);
    circle.setAttribute("cy", node.y);
    circle.setAttribute("r", NODE_RADIUS);

    label.setAttribute("class", "node-label");
    label.setAttribute("x", node.x);
    label.setAttribute("y", node.y);
    label.textContent = node.id;

    group.appendChild(circle);
    group.appendChild(label);
    group.addEventListener("click", handleNodeClick);
    graphCanvas.appendChild(group);
  });

  updateSummaries();
}

function runGraphBFS() {
  const visited = new Set([startNodeId]);
  const queue = [startNodeId];
  const order = [];

  while (queue.length > 0) {
    const currentNodeId = queue.shift();
    order.push(currentNodeId);

    adjacencyList[currentNodeId].forEach((neighborId) => {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push(neighborId);
      }
    });
  }

  return order;
}

function runGraphDFS() {
  const visited = new Set();
  const order = [];

  function visit(nodeId) {
    visited.add(nodeId);
    order.push(nodeId);

    adjacencyList[nodeId].forEach((neighborId) => {
      if (!visited.has(neighborId)) {
        visit(neighborId);
      }
    });
  }

  visit(startNodeId);
  return order;
}

function runShortestPathBFS() {
  const visited = new Set([startNodeId]);
  const queue = [startNodeId];
  const previous = {};
  const order = [];

  while (queue.length > 0) {
    const currentNodeId = queue.shift();
    order.push(currentNodeId);

    if (currentNodeId === targetNodeId) {
      return {
        order,
        path: reconstructPath(previous, startNodeId, targetNodeId),
      };
    }

    adjacencyList[currentNodeId].forEach((neighborId) => {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        previous[neighborId] = currentNodeId;
        queue.push(neighborId);
      }
    });
  }

  return { order, path: [] };
}

async function animateGraphTraversal(order, finalPath = []) {
  isAnimating = true;
  setControlsDisabled(true);
  clearHighlights();

  for (const nodeId of order) {
    visitedNodeIds.add(nodeId);
    renderGraph();
    await sleep(ANIMATION_DELAY_MS);
  }

  if (finalPath.length > 0) {
    finalPath.forEach((nodeId, index) => {
      pathNodeIds.add(nodeId);

      if (index < finalPath.length - 1) {
        pathEdgeKeys.add(getEdgeKey(nodeId, finalPath[index + 1]));
      }
    });

    renderGraph();
  }

  setControlsDisabled(false);
  isAnimating = false;
}

async function handleVisualize() {
  if (isAnimating) {
    return;
  }

  if (!startNodeId) {
    setMessage("Select a start node first.");
    return;
  }

  if (algorithmSelect.value === "shortest-path" && !targetNodeId) {
    setMessage("Select a target node for shortest path BFS.");
    return;
  }

  if (algorithmSelect.value === "dfs") {
    const order = runGraphDFS();
    resultOutput.textContent = `DFS order: ${order.join(" -> ")}`;
    await animateGraphTraversal(order);
    setMessage("DFS traversal complete.");
    return;
  }

  if (algorithmSelect.value === "shortest-path") {
    const result = runShortestPathBFS();
    const pathText = result.path.length === 0 ? "No path found." : result.path.join(" -> ");

    resultOutput.textContent = `Shortest path: ${pathText}`;
    await animateGraphTraversal(result.order, result.path);
    setMessage(result.path.length === 0 ? "Target was not reachable." : "Shortest path BFS complete.");
    return;
  }

  const order = runGraphBFS();
  resultOutput.textContent = `BFS order: ${order.join(" -> ")}`;
  await animateGraphTraversal(order);
  setMessage("BFS traversal complete.");
}

function handleCanvasClick(event) {
  if (isAnimating || activeTool !== "add-node") {
    return;
  }

  if (event.target !== graphCanvas) {
    return;
  }

  const point = getCanvasPoint(event);
  addNode(point.x, point.y);
}

function handleNodeClick(event) {
  event.stopPropagation();

  if (isAnimating) {
    return;
  }

  const nodeId = event.currentTarget.dataset.nodeId;

  if (activeTool === "set-start") {
    startNodeId = nodeId;
    renderGraph();
    setMessage(`Start node set to ${nodeId}.`);
    return;
  }

  if (activeTool === "set-target") {
    targetNodeId = nodeId;
    renderGraph();
    setMessage(`Target node set to ${nodeId}.`);
    return;
  }

  if (activeTool === "add-edge") {
    handleEdgeSelection(nodeId);
  }
}

function handleEdgeSelection(nodeId) {
  if (!selectedEdgeNodeId) {
    selectedEdgeNodeId = nodeId;
    renderGraph();
    setMessage(`Selected ${nodeId}. Choose another node to connect.`);
    return;
  }

  addEdge(selectedEdgeNodeId, nodeId);
  selectedEdgeNodeId = null;
  renderGraph();
}

function setActiveTool(tool) {
  if (isAnimating) {
    return;
  }

  activeTool = tool;
  selectedEdgeNodeId = null;
  updateToolButtonStyles();

  renderGraph();
  setMessage(getToolMessage(tool));
}

function updateToolButtonStyles() {
  toolButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tool === activeTool);
  });
}

function generateExampleGraph() {
  if (isAnimating) {
    return;
  }

  nodes = [
    { id: "N1", x: 150, y: 120 },
    { id: "N2", x: 330, y: 90 },
    { id: "N3", x: 520, y: 150 },
    { id: "N4", x: 230, y: 300 },
    { id: "N5", x: 450, y: 320 },
    { id: "N6", x: 650, y: 260 },
  ];
  edges = [];
  adjacencyList = {};
  nextNodeNumber = 7;

  nodes.forEach((node) => {
    adjacencyList[node.id] = [];
  });

  [
    ["N1", "N2"],
    ["N1", "N4"],
    ["N2", "N3"],
    ["N2", "N5"],
    ["N3", "N6"],
    ["N4", "N5"],
    ["N5", "N6"],
  ].forEach(([firstNodeId, secondNodeId]) => {
    addEdgeWithoutRendering(firstNodeId, secondNodeId);
  });

  startNodeId = "N1";
  targetNodeId = "N6";
  selectedEdgeNodeId = null;
  clearHighlights();
  renderGraph();
  setMessage("Example graph generated.");
}

function clearGraph() {
  if (isAnimating) {
    return;
  }

  nodes = [];
  edges = [];
  adjacencyList = {};
  startNodeId = null;
  targetNodeId = null;
  selectedEdgeNodeId = null;
  activeTool = "add-node";
  nextNodeNumber = 1;
  clearHighlights();
  updateToolButtonStyles();
  renderGraph();
  resultOutput.textContent = "No algorithm run yet.";
  setMessage("Graph cleared.");
}

function addEdgeWithoutRendering(firstNodeId, secondNodeId) {
  edges.push({ from: firstNodeId, to: secondNodeId });
  adjacencyList[firstNodeId].push(secondNodeId);
  adjacencyList[secondNodeId].push(firstNodeId);
}

function reconstructPath(previous, startId, targetId) {
  const path = [];
  let currentNodeId = targetId;

  while (currentNodeId) {
    path.unshift(currentNodeId);

    if (currentNodeId === startId) {
      return path;
    }

    currentNodeId = previous[currentNodeId];
  }

  return [];
}

function getCanvasPoint(event) {
  const rect = graphCanvas.getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function getNodeById(nodeId) {
  return nodes.find((node) => node.id === nodeId);
}

function hasEdge(firstNodeId, secondNodeId) {
  return edges.some((edge) => {
    return (
      (edge.from === firstNodeId && edge.to === secondNodeId) ||
      (edge.from === secondNodeId && edge.to === firstNodeId)
    );
  });
}

function getEdgeKey(firstNodeId, secondNodeId) {
  return [firstNodeId, secondNodeId].sort().join("-");
}

function getEdgeClass(firstNodeId, secondNodeId) {
  const classes = ["graph-edge"];

  if (pathEdgeKeys.has(getEdgeKey(firstNodeId, secondNodeId))) {
    classes.push("is-path");
  }

  return classes.join(" ");
}

function getNodeClass(nodeId) {
  const classes = ["graph-node"];

  if (nodeId === startNodeId) {
    classes.push("is-start");
  }

  if (nodeId === targetNodeId) {
    classes.push("is-target");
  }

  if (nodeId === selectedEdgeNodeId) {
    classes.push("is-selected");
  }

  if (visitedNodeIds.has(nodeId)) {
    classes.push("is-visited");
  }

  if (pathNodeIds.has(nodeId)) {
    classes.push("is-path");
  }

  return classes.join(" ");
}

function clearHighlights() {
  visitedNodeIds = new Set();
  pathNodeIds = new Set();
  pathEdgeKeys = new Set();
}

function updateSummaries() {
  graphSummary.textContent = `Nodes: ${nodes.length} | Edges: ${edges.length}`;
  startTargetSummary.textContent = `Start: ${startNodeId || "none"} | Target: ${targetNodeId || "none"}`;
}

function setControlsDisabled(shouldDisable) {
  controls.forEach((control) => {
    control.disabled = shouldDisable;
  });
}

function setMessage(message) {
  statusMessage.textContent = message;
}

function getToolMessage(tool) {
  const messages = {
    "add-node": "Click empty graph space to add nodes.",
    "add-edge": "Click two different nodes to add an edge.",
    "set-start": "Click a node to set the start node.",
    "set-target": "Click a node to set the target node.",
  };

  return messages[tool];
}

function sleep(delayInMilliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delayInMilliseconds);
  });
}

graphCanvas.addEventListener("click", handleCanvasClick);
visualizeButton.addEventListener("click", handleVisualize);
exampleButton.addEventListener("click", generateExampleGraph);
clearButton.addEventListener("click", clearGraph);

toolButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveTool(button.dataset.tool);
  });
});

renderGraph();
