// Binary Search Tree Visualizer.
// The tree is stored as linked node objects with value, left, and right.

const NODE_RADIUS = 24;
const LEVEL_GAP = 96;
const HIGHLIGHT_DELAY_MS = 520;
const EXAMPLE_VALUES = [50, 30, 70, 20, 40, 60, 80, 35, 45];

const valueInput = document.querySelector("#value-input");
const insertButton = document.querySelector("#insert-button");
const searchButton = document.querySelector("#search-button");
const deleteButton = document.querySelector("#delete-button");
const exampleButton = document.querySelector("#example-button");
const resetButton = document.querySelector("#reset-button");
const traversalButtons = document.querySelectorAll(".traversal-button");
const statusMessage = document.querySelector("#status-message");
const traversalResult = document.querySelector("#traversal-result");
const treeCanvas = document.querySelector("#tree-canvas");
const edgeLayer = document.querySelector("#edge-layer");
const nodeLayer = document.querySelector("#node-layer");

const controls = [
  valueInput,
  insertButton,
  searchButton,
  deleteButton,
  exampleButton,
  resetButton,
  ...traversalButtons,
];

let root = null;
let isAnimating = false;

function createNode(value) {
  return {
    value,
    left: null,
    right: null,
    x: 0,
    y: 0,
  };
}

function insertNode(currentNode, value) {
  if (currentNode === null) {
    return createNode(value);
  }

  // Smaller values recursively move left. Larger values recursively move right.
  if (value < currentNode.value) {
    currentNode.left = insertNode(currentNode.left, value);
  } else if (value > currentNode.value) {
    currentNode.right = insertNode(currentNode.right, value);
  }

  return currentNode;
}

function searchNode(currentNode, value, path = []) {
  if (currentNode === null) {
    return { found: false, path };
  }

  path.push(currentNode);

  if (value === currentNode.value) {
    return { found: true, path };
  }

  if (value < currentNode.value) {
    return searchNode(currentNode.left, value, path);
  }

  return searchNode(currentNode.right, value, path);
}

function deleteNode(currentNode, value) {
  if (currentNode === null) {
    return null;
  }

  // Recursively search for the node to delete.
  if (value < currentNode.value) {
    currentNode.left = deleteNode(currentNode.left, value);
    return currentNode;
  }

  if (value > currentNode.value) {
    currentNode.right = deleteNode(currentNode.right, value);
    return currentNode;
  }

  // Leaf node or one-child cases can return the remaining child directly.
  if (currentNode.left === null) {
    return currentNode.right;
  }

  if (currentNode.right === null) {
    return currentNode.left;
  }

  // Two-child delete: replace with the smallest value in the right subtree.
  const successor = findMinNode(currentNode.right);
  currentNode.value = successor.value;
  currentNode.right = deleteNode(currentNode.right, successor.value);

  return currentNode;
}

function findMinNode(currentNode) {
  let node = currentNode;

  while (node.left !== null) {
    node = node.left;
  }

  return node;
}

function renderTree() {
  edgeLayer.innerHTML = "";
  nodeLayer.innerHTML = "";

  if (root === null) {
    nodeLayer.innerHTML = '<div class="empty-tree">Tree is empty.</div>';
    return;
  }

  const positionedNodes = [];
  const edges = [];
  let nextX = NODE_RADIUS + 36;

  function assignPositions(node, depth) {
    if (node === null) {
      return;
    }

    assignPositions(node.left, depth + 1);
    node.x = nextX;
    node.y = NODE_RADIUS + 36 + depth * LEVEL_GAP;
    nextX += 86;
    positionedNodes.push(node);

    if (node.left) {
      edges.push({ parent: node, child: node.left });
    }

    if (node.right) {
      edges.push({ parent: node, child: node.right });
    }

    assignPositions(node.right, depth + 1);
  }

  assignPositions(root, 0);

  const canvasWidth = Math.max(900, nextX + NODE_RADIUS);
  const canvasHeight = Math.max(560, getTreeHeight(root) * LEVEL_GAP + 120);

  treeCanvas.style.minWidth = `${canvasWidth}px`;
  treeCanvas.style.minHeight = `${canvasHeight}px`;
  edgeLayer.setAttribute("viewBox", `0 0 ${canvasWidth} ${canvasHeight}`);

  edges.forEach((edge) => {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");

    line.setAttribute("x1", edge.parent.x);
    line.setAttribute("y1", edge.parent.y);
    line.setAttribute("x2", edge.child.x);
    line.setAttribute("y2", edge.child.y);
    line.setAttribute("class", "tree-edge");
    edgeLayer.appendChild(line);
  });

  positionedNodes.forEach((node) => {
    const nodeElement = document.createElement("div");

    nodeElement.className = "tree-node";
    nodeElement.dataset.value = String(node.value);
    nodeElement.style.left = `${node.x}px`;
    nodeElement.style.top = `${node.y}px`;
    nodeElement.textContent = node.value;
    nodeLayer.appendChild(nodeElement);
  });
}

async function animateTraversal(nodes) {
  if (nodes.length === 0) {
    setMessage("Tree is empty.");
    return;
  }

  isAnimating = true;
  setControlsDisabled(true);
  clearHighlights();

  for (const node of nodes) {
    highlightNode(node.value, "is-highlighted");
    await sleep(HIGHLIGHT_DELAY_MS);
  }

  setControlsDisabled(false);
  isAnimating = false;
}

function handleInsert() {
  if (isAnimating) {
    return;
  }

  const value = readInputValue();

  if (value === null) {
    return;
  }

  const searchResult = searchNode(root, value);

  if (searchResult.found) {
    setMessage(`${value} is already in the tree. Duplicates are not inserted.`);
    return;
  }

  root = insertNode(root, value);
  renderTree();
  setMessage(`${value} inserted.`);
  traversalResult.textContent = "No traversal run yet.";
}

async function handleSearch() {
  if (isAnimating) {
    return;
  }

  const value = readInputValue();

  if (value === null) {
    return;
  }

  if (root === null) {
    setMessage("Tree is empty.");
    return;
  }

  const result = searchNode(root, value);

  isAnimating = true;
  setControlsDisabled(true);
  clearHighlights();

  for (const node of result.path) {
    highlightNode(node.value, node.value === value && result.found ? "is-found" : "is-highlighted");
    await sleep(HIGHLIGHT_DELAY_MS);
  }

  setMessage(result.found ? `${value} found.` : `${value} was not found.`);
  setControlsDisabled(false);
  isAnimating = false;
}

function handleDelete() {
  if (isAnimating) {
    return;
  }

  const value = readInputValue();

  if (value === null) {
    return;
  }

  if (root === null) {
    setMessage("Tree is empty.");
    return;
  }

  const result = searchNode(root, value);

  if (!result.found) {
    setMessage(`${value} was not found.`);
    return;
  }

  root = deleteNode(root, value);
  renderTree();
  setMessage(`${value} deleted.`);
  traversalResult.textContent = "No traversal run yet.";
}

function generateExampleTree() {
  if (isAnimating) {
    return;
  }

  root = null;

  EXAMPLE_VALUES.forEach((value) => {
    root = insertNode(root, value);
  });

  renderTree();
  setMessage("Example tree generated.");
  traversalResult.textContent = "No traversal run yet.";
}

function resetTree() {
  if (isAnimating) {
    return;
  }

  root = null;
  valueInput.value = "";
  renderTree();
  setMessage("Tree reset.");
  traversalResult.textContent = "No traversal run yet.";
}

async function handleTraversal(event) {
  if (isAnimating) {
    return;
  }

  if (root === null) {
    setMessage("Tree is empty.");
    return;
  }

  const traversalType = event.currentTarget.dataset.traversal;
  const nodes = getTraversalNodes(traversalType);
  const values = nodes.map((node) => node.value);

  traversalResult.textContent = values.join(" -> ");
  setMessage(`${getTraversalLabel(traversalType)} traversal running.`);
  await animateTraversal(nodes);
  setMessage(`${getTraversalLabel(traversalType)} traversal complete.`);
}

function getTraversalNodes(type) {
  if (type === "preorder") {
    return getPreorder(root);
  }

  if (type === "postorder") {
    return getPostorder(root);
  }

  if (type === "levelorder") {
    return getLevelOrder(root);
  }

  return getInorder(root);
}

function getInorder(node) {
  if (node === null) {
    return [];
  }

  return [...getInorder(node.left), node, ...getInorder(node.right)];
}

function getPreorder(node) {
  if (node === null) {
    return [];
  }

  return [node, ...getPreorder(node.left), ...getPreorder(node.right)];
}

function getPostorder(node) {
  if (node === null) {
    return [];
  }

  return [...getPostorder(node.left), ...getPostorder(node.right), node];
}

function getLevelOrder(node) {
  const result = [];
  const queue = [node];

  while (queue.length > 0) {
    const currentNode = queue.shift();
    result.push(currentNode);

    if (currentNode.left) {
      queue.push(currentNode.left);
    }

    if (currentNode.right) {
      queue.push(currentNode.right);
    }
  }

  return result;
}

function readInputValue() {
  const value = Number(valueInput.value);

  if (!Number.isInteger(value)) {
    setMessage("Enter a whole number.");
    return null;
  }

  return value;
}

function highlightNode(value, className) {
  const nodeElement = nodeLayer.querySelector(`[data-value="${value}"]`);

  if (nodeElement) {
    nodeElement.classList.add(className);
  }
}

function clearHighlights() {
  nodeLayer.querySelectorAll(".tree-node").forEach((nodeElement) => {
    nodeElement.classList.remove("is-highlighted", "is-found");
  });
}

function getTreeHeight(node) {
  if (node === null) {
    return 0;
  }

  return 1 + Math.max(getTreeHeight(node.left), getTreeHeight(node.right));
}

function setControlsDisabled(shouldDisable) {
  controls.forEach((control) => {
    control.disabled = shouldDisable;
  });
}

function setMessage(message) {
  statusMessage.textContent = message;
}

function getTraversalLabel(type) {
  const labels = {
    inorder: "Inorder",
    preorder: "Preorder",
    postorder: "Postorder",
    levelorder: "Level Order",
  };

  return labels[type];
}

function sleep(delayInMilliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delayInMilliseconds);
  });
}

insertButton.addEventListener("click", handleInsert);
searchButton.addEventListener("click", handleSearch);
deleteButton.addEventListener("click", handleDelete);
exampleButton.addEventListener("click", generateExampleTree);
resetButton.addEventListener("click", resetTree);

traversalButtons.forEach((button) => {
  button.addEventListener("click", handleTraversal);
});

renderTree();
