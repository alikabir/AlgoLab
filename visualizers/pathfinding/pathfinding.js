// Pathfinding visualizer grid setup.
// This phase supports BFS, Dijkstra, and A* search.

const ROWS = 20;
const COLS = 30;
const VISITED_DELAY_MS = 15;
const PATH_DELAY_MS = 35;
const DEFAULT_START_NODE = { row: 9, col: 5 };
const DEFAULT_END_NODE = { row: 9, col: 24 };

const CELL_STATES = {
  EMPTY: "empty",
  START: "start",
  END: "end",
  WALL: "wall",
  VISITED: "visited",
  PATH: "path",
};

const TOOLS = {
  START: "start",
  END: "end",
  WALL: "wall",
  ERASE: "erase",
};

const gridElement = document.querySelector("#pathfinding-grid");
const algorithmSelect = document.querySelector("#algorithm-select");
const algorithmInfo = document.querySelector("#algorithm-info");
const clearGridButton = document.querySelector("#clear-grid-button");
const resetBoardButton = document.querySelector("#reset-board-button");
const visualizeButton = document.querySelector("#visualize-button");
const statusMessage = document.querySelector("#status-message");
const toolButtons = document.querySelectorAll(".tool-button");
const controls = [
  ...toolButtons,
  algorithmSelect,
  clearGridButton,
  resetBoardButton,
  visualizeButton,
];

const ALGORITHM_INFO = {
  bfs: "BFS explores level by level.",
  dijkstra: "Dijkstra finds the shortest path using distances.",
  astar: "A* uses a heuristic to guide search toward the target.",
};

let grid = [];
let activeTool = TOOLS.WALL;
let isDrawing = false;
let isAnimating = false;
let startNode = { ...DEFAULT_START_NODE };
let endNode = { ...DEFAULT_END_NODE };

function createGrid() {
  grid = [];

  for (let row = 0; row < ROWS; row += 1) {
    const currentRow = [];

    for (let col = 0; col < COLS; col += 1) {
      currentRow.push({
        row,
        col,
        state: CELL_STATES.EMPTY,
      });
    }

    grid.push(currentRow);
  }

  setCellState(startNode.row, startNode.col, CELL_STATES.START);
  setCellState(endNode.row, endNode.col, CELL_STATES.END);
}

function renderGrid() {
  gridElement.innerHTML = "";
  gridElement.style.gridTemplateColumns = `repeat(${COLS}, minmax(0, 1fr))`;

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const cell = grid[row][col];
      const cellButton = document.createElement("button");

      cellButton.type = "button";
      cellButton.className = `grid-cell cell-${cell.state}`;
      cellButton.dataset.row = String(row);
      cellButton.dataset.col = String(col);
      cellButton.setAttribute("role", "gridcell");
      cellButton.setAttribute("aria-label", `Row ${row + 1}, column ${col + 1}, ${cell.state}`);

      cellButton.addEventListener("pointerdown", handleCellPointerDown);
      cellButton.addEventListener("pointerenter", handleCellPointerEnter);

      gridElement.appendChild(cellButton);
    }
  }
}

function setCellState(row, col, state) {
  grid[row][col].state = state;
  updateCellDisplay(row, col);
}

function updateCellDisplay(row, col) {
  const cell = grid[row][col];
  const cellButton = gridElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);

  if (!cellButton) {
    return;
  }

  cellButton.className = `grid-cell cell-${cell.state}`;
  cellButton.setAttribute("aria-label", `Row ${row + 1}, column ${col + 1}, ${cell.state}`);
}

function getCellFromEvent(event) {
  const row = Number(event.currentTarget.dataset.row);
  const col = Number(event.currentTarget.dataset.col);

  return grid[row][col];
}

function isStartOrEnd(cell) {
  return cell.state === CELL_STATES.START || cell.state === CELL_STATES.END;
}

function isSearchState(cell) {
  return cell.state === CELL_STATES.VISITED || cell.state === CELL_STATES.PATH;
}

function moveStartNode(row, col) {
  clearSearchResults();
  const targetCell = grid[row][col];

  if (targetCell.state === CELL_STATES.END) {
    updateStatus("Choose a different cell for the start node.");
    return;
  }

  setCellState(startNode.row, startNode.col, CELL_STATES.EMPTY);
  startNode = { row, col };
  setCellState(row, col, CELL_STATES.START);
  updateStatus("Start node moved.");
}

function moveEndNode(row, col) {
  clearSearchResults();
  const targetCell = grid[row][col];

  if (targetCell.state === CELL_STATES.START) {
    updateStatus("Choose a different cell for the end node.");
    return;
  }

  setCellState(endNode.row, endNode.col, CELL_STATES.EMPTY);
  endNode = { row, col };
  setCellState(row, col, CELL_STATES.END);
  updateStatus("End node moved.");
}

function applyActiveTool(cell) {
  if (isAnimating) {
    return;
  }

  if (activeTool === TOOLS.START) {
    moveStartNode(cell.row, cell.col);
    return;
  }

  if (activeTool === TOOLS.END) {
    moveEndNode(cell.row, cell.col);
    return;
  }

  if (activeTool === TOOLS.WALL) {
    if (isStartOrEnd(cell)) {
      updateStatus("Start and end nodes cannot be turned into walls.");
      return;
    }

    clearSearchResults();
    setCellState(cell.row, cell.col, CELL_STATES.WALL);
    return;
  }

  if (activeTool === TOOLS.ERASE) {
    if (isStartOrEnd(cell)) {
      updateStatus("Use Start Node or End Node to move those cells.");
      return;
    }

    clearSearchResults();
    setCellState(cell.row, cell.col, CELL_STATES.EMPTY);
  }
}

function clearGrid() {
  clearSearchResults();
  updateStatus("Search results cleared. Walls, start, and end stayed in place.");
}

function clearSearchResults() {
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const cell = grid[row][col];

      if (isSearchState(cell)) {
        setCellState(row, col, CELL_STATES.EMPTY);
      }
    }
  }
}

function resetBoard() {
  startNode = { ...DEFAULT_START_NODE };
  endNode = { ...DEFAULT_END_NODE };
  createGrid();
  renderGrid();
  updateStatus("Board reset to the default start and end nodes.");
}

function handleCellPointerDown(event) {
  if (isAnimating) {
    return;
  }

  event.preventDefault();
  isDrawing = true;
  applyActiveTool(getCellFromEvent(event));
}

function handleCellPointerEnter(event) {
  if (!isDrawing) {
    return;
  }

  // Drag drawing is intended for walls and erasing. Start/end placement stays click based.
  if (activeTool === TOOLS.WALL || activeTool === TOOLS.ERASE) {
    applyActiveTool(getCellFromEvent(event));
  }
}

function stopDrawing() {
  isDrawing = false;
}

function setActiveTool(tool) {
  if (isAnimating) {
    return;
  }

  activeTool = tool;

  toolButtons.forEach((button) => {
    const isSelected = button.dataset.tool === tool;
    button.classList.toggle("is-active", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });

  updateStatus(`Active tool: ${getToolLabel(tool)}.`);
}

function getToolLabel(tool) {
  const labels = {
    [TOOLS.START]: "Start Node",
    [TOOLS.END]: "End Node",
    [TOOLS.WALL]: "Draw Walls",
    [TOOLS.ERASE]: "Erase",
  };

  return labels[tool];
}

function updateStatus(message) {
  statusMessage.textContent = message;
}

function getCellId(cell) {
  return `${cell.row}-${cell.col}`;
}

function getNeighbors(cell) {
  const directions = [
    { rowChange: -1, colChange: 0 },
    { rowChange: 1, colChange: 0 },
    { rowChange: 0, colChange: -1 },
    { rowChange: 0, colChange: 1 },
  ];
  const neighbors = [];

  directions.forEach((direction) => {
    const nextRow = cell.row + direction.rowChange;
    const nextCol = cell.col + direction.colChange;

    if (nextRow < 0 || nextRow >= ROWS || nextCol < 0 || nextCol >= COLS) {
      return;
    }

    neighbors.push(grid[nextRow][nextCol]);
  });

  return neighbors;
}

function runBFS() {
  const startCell = grid[startNode.row]?.[startNode.col];
  const endCell = grid[endNode.row]?.[endNode.col];

  if (!startCell || !endCell) {
    updateStatus("Start or end node is missing.");
    return { visitedCells: [], pathCells: [], foundEnd: false };
  }

  const queue = [startCell];
  const visitedCellIds = new Set([getCellId(startCell)]);
  const previousCells = new Map();
  const visitedCells = [];
  let foundEnd = false;

  while (queue.length > 0) {
    const currentCell = queue.shift();

    if (currentCell === endCell) {
      foundEnd = true;
      break;
    }

    const neighbors = getNeighbors(currentCell);

    neighbors.forEach((neighbor) => {
      const neighborId = getCellId(neighbor);

      if (visitedCellIds.has(neighborId) || neighbor.state === CELL_STATES.WALL) {
        return;
      }

      visitedCellIds.add(neighborId);
      previousCells.set(neighborId, currentCell);
      queue.push(neighbor);

      if (neighbor !== endCell) {
        visitedCells.push(neighbor);
      }
    });
  }

  return {
    visitedCells,
    pathCells: foundEnd ? reconstructPath(previousCells, startCell, endCell) : [],
    foundEnd,
  };
}

function initializeDistances(startCell) {
  const distances = new Map();
  const unvisitedCells = [];

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const cell = grid[row][col];

      if (cell.state !== CELL_STATES.WALL) {
        distances.set(getCellId(cell), Infinity);
        unvisitedCells.push(cell);
      }
    }
  }

  distances.set(getCellId(startCell), 0);

  return { distances, unvisitedCells };
}

function getUnvisitedNodeWithSmallestDistance(unvisitedCells, distances) {
  let smallestDistance = Infinity;
  let closestCellIndex = -1;

  unvisitedCells.forEach((cell, index) => {
    const distance = distances.get(getCellId(cell));

    if (distance < smallestDistance) {
      smallestDistance = distance;
      closestCellIndex = index;
    }
  });

  if (closestCellIndex === -1) {
    return null;
  }

  const closestCell = unvisitedCells[closestCellIndex];
  unvisitedCells.splice(closestCellIndex, 1);

  return closestCell;
}

function runDijkstra() {
  const startCell = grid[startNode.row]?.[startNode.col];
  const endCell = grid[endNode.row]?.[endNode.col];

  if (!startCell || !endCell) {
    updateStatus("Start or end node is missing.");
    return { visitedCells: [], pathCells: [], foundEnd: false };
  }

  const { distances, unvisitedCells } = initializeDistances(startCell);
  const previousCells = new Map();
  const visitedCells = [];
  const visitedCellIds = new Set();
  let foundEnd = false;

  while (unvisitedCells.length > 0) {
    const currentCell = getUnvisitedNodeWithSmallestDistance(unvisitedCells, distances);

    if (!currentCell || distances.get(getCellId(currentCell)) === Infinity) {
      break;
    }

    visitedCellIds.add(getCellId(currentCell));

    if (currentCell !== startCell && currentCell !== endCell) {
      visitedCells.push(currentCell);
    }

    if (currentCell === endCell) {
      foundEnd = true;
      break;
    }

    getNeighbors(currentCell).forEach((neighbor) => {
      const neighborId = getCellId(neighbor);

      if (neighbor.state === CELL_STATES.WALL || visitedCellIds.has(neighborId)) {
        return;
      }

      // Every move currently has weight 1, so Dijkstra relaxes neighbors by +1.
      const newDistance = distances.get(getCellId(currentCell)) + 1;

      if (newDistance < distances.get(neighborId)) {
        distances.set(neighborId, newDistance);
        previousCells.set(neighborId, currentCell);
      }
    });
  }

  return {
    visitedCells,
    pathCells: foundEnd ? reconstructPath(previousCells, startCell, endCell) : [],
    foundEnd,
  };
}

function manhattanDistance(firstCell, secondCell) {
  return Math.abs(firstCell.row - secondCell.row) + Math.abs(firstCell.col - secondCell.col);
}

function getLowestFScoreNode(openCells, fScores, hScores) {
  let bestIndex = 0;

  for (let index = 1; index < openCells.length; index += 1) {
    const currentCell = openCells[index];
    const bestCell = openCells[bestIndex];
    const currentId = getCellId(currentCell);
    const bestId = getCellId(bestCell);
    const currentFScore = fScores.get(currentId);
    const bestFScore = fScores.get(bestId);
    const currentHScore = hScores.get(currentId);
    const bestHScore = hScores.get(bestId);

    if (currentFScore < bestFScore) {
      bestIndex = index;
    }

    if (currentFScore === bestFScore && currentHScore < bestHScore) {
      bestIndex = index;
    }
  }

  const bestCell = openCells[bestIndex];
  openCells.splice(bestIndex, 1);

  return bestCell;
}

function runAStar() {
  const startCell = grid[startNode.row]?.[startNode.col];
  const endCell = grid[endNode.row]?.[endNode.col];

  if (!startCell || !endCell) {
    updateStatus("Start or end node is missing.");
    return { visitedCells: [], pathCells: [], foundEnd: false };
  }

  const openCells = [startCell];
  const openCellIds = new Set([getCellId(startCell)]);
  const closedCellIds = new Set();
  const previousCells = new Map();
  const visitedCells = [];
  const gScores = new Map();
  const hScores = new Map();
  const fScores = new Map();
  let foundEnd = false;

  initializeAStarScores(gScores, hScores, fScores, startCell, endCell);

  while (openCells.length > 0) {
    const currentCell = getLowestFScoreNode(openCells, fScores, hScores);
    const currentId = getCellId(currentCell);

    openCellIds.delete(currentId);

    if (currentCell === endCell) {
      foundEnd = true;
      break;
    }

    closedCellIds.add(currentId);

    if (currentCell !== startCell) {
      visitedCells.push(currentCell);
    }

    getNeighbors(currentCell).forEach((neighbor) => {
      const neighborId = getCellId(neighbor);

      if (neighbor.state === CELL_STATES.WALL || closedCellIds.has(neighborId)) {
        return;
      }

      // gScore is the known cost from the start node to this neighbor.
      const tentativeGScore = gScores.get(currentId) + 1;

      if (tentativeGScore >= gScores.get(neighborId)) {
        return;
      }

      previousCells.set(neighborId, currentCell);
      gScores.set(neighborId, tentativeGScore);

      // hScore estimates the remaining distance from the neighbor to the end.
      hScores.set(neighborId, manhattanDistance(neighbor, endCell));

      // fScore combines real cost so far and estimated cost remaining.
      fScores.set(neighborId, gScores.get(neighborId) + hScores.get(neighborId));

      if (!openCellIds.has(neighborId)) {
        openCells.push(neighbor);
        openCellIds.add(neighborId);
      }
    });
  }

  return {
    visitedCells,
    pathCells: foundEnd ? reconstructPath(previousCells, startCell, endCell) : [],
    foundEnd,
  };
}

function initializeAStarScores(gScores, hScores, fScores, startCell, endCell) {
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const cell = grid[row][col];
      const cellId = getCellId(cell);

      gScores.set(cellId, Infinity);
      hScores.set(cellId, manhattanDistance(cell, endCell));
      fScores.set(cellId, Infinity);
    }
  }

  gScores.set(getCellId(startCell), 0);
  fScores.set(getCellId(startCell), hScores.get(getCellId(startCell)));
}

function reconstructPath(previousCells, startCell, endCell) {
  const pathCells = [];
  let currentCell = endCell;

  while (currentCell !== startCell) {
    const previousCell = previousCells.get(getCellId(currentCell));

    if (!previousCell) {
      return [];
    }

    if (currentCell !== endCell) {
      pathCells.unshift(currentCell);
    }

    currentCell = previousCell;
  }

  return pathCells;
}

async function animateVisitedCells(visitedCells) {
  for (const cell of visitedCells) {
    if (cell.state === CELL_STATES.EMPTY) {
      setCellState(cell.row, cell.col, CELL_STATES.VISITED);
    }

    await wait(VISITED_DELAY_MS);
  }
}

async function animatePath(pathCells) {
  for (const cell of pathCells) {
    setCellState(cell.row, cell.col, CELL_STATES.PATH);
    await wait(PATH_DELAY_MS);
  }
}

function wait(delayInMilliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delayInMilliseconds);
  });
}

function setControlsDisabled(shouldDisable) {
  controls.forEach((control) => {
    control.disabled = shouldDisable;
  });
}

async function handleVisualize() {
  if (isAnimating) {
    return;
  }

  clearSearchResults();
  isAnimating = true;
  isDrawing = false;
  setControlsDisabled(true);
  updateStatus(`Running ${getSelectedAlgorithmName()}...`);

  const result = runSelectedAlgorithm();

  await animateVisitedCells(result.visitedCells);

  if (result.foundEnd) {
    await animatePath(result.pathCells);
    updateStatus(
      `${getSelectedAlgorithmName()} complete. Shortest path length: ${result.pathCells.length} cells.`
    );
  } else {
    updateStatus("No path found.");
  }

  isAnimating = false;
  setControlsDisabled(false);
}

function getSelectedAlgorithmName() {
  const names = {
    bfs: "BFS",
    dijkstra: "Dijkstra",
    astar: "A*",
  };

  return names[algorithmSelect.value] || "Selected algorithm";
}

function runSelectedAlgorithm() {
  if (algorithmSelect.value === "dijkstra") {
    return runDijkstra();
  }

  if (algorithmSelect.value === "astar") {
    return runAStar();
  }

  return runBFS();
}

function updateAlgorithmInfo() {
  algorithmInfo.textContent = ALGORITHM_INFO[algorithmSelect.value];
}

toolButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveTool(button.dataset.tool);
  });
});

algorithmSelect.addEventListener("change", updateAlgorithmInfo);
clearGridButton.addEventListener("click", clearGrid);
resetBoardButton.addEventListener("click", resetBoard);
visualizeButton.addEventListener("click", handleVisualize);
window.addEventListener("pointerup", stopDrawing);

createGrid();
renderGrid();
setActiveTool(activeTool);
updateAlgorithmInfo();
