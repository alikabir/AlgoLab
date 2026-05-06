// Page Replacement Visualizer.
// FIFO, LRU, and Optimal all produce the same step shape for shared rendering.

const DEFAULT_REFERENCE_STRING = "7,0,1,2,0,3,0,4,2,3,0,3,2";

const referenceInput = document.querySelector("#reference-string");
const frameCountInput = document.querySelector("#frame-count");
const algorithmSelect = document.querySelector("#algorithm-select");
const speedControl = document.querySelector("#speed-control");
const runButton = document.querySelector("#run-button");
const exampleButton = document.querySelector("#example-button");
const resetButton = document.querySelector("#reset-button");
const statusMessage = document.querySelector("#status-message");
const currentRequestText = document.querySelector("#current-request");
const referenceStrip = document.querySelector("#reference-strip");
const framesView = document.querySelector("#frames-view");
const stepResult = document.querySelector("#step-result");
const historyBody = document.querySelector("#history-body");
const pageFaultsText = document.querySelector("#page-faults");
const pageHitsText = document.querySelector("#page-hits");
const faultRatioText = document.querySelector("#fault-ratio");
const hitRatioText = document.querySelector("#hit-ratio");

const controls = [
  referenceInput,
  frameCountInput,
  algorithmSelect,
  speedControl,
  runButton,
  exampleButton,
  resetButton,
];

let isAnimating = false;
let activeRunId = 0;

function parseReferenceString() {
  const rawValue = referenceInput.value.trim();

  if (rawValue.length === 0) {
    setMessage("Reference string cannot be empty.");
    return null;
  }

  const parts = rawValue.split(",").map((part) => part.trim());
  const pages = [];

  for (const part of parts) {
    if (!/^\d+$/.test(part)) {
      setMessage("Reference string must contain only non-negative numbers separated by commas.");
      return null;
    }

    pages.push(Number(part));
  }

  return pages;
}

function runFIFO(pages, frameCount) {
  const frames = [];
  const queue = [];
  const steps = [];

  pages.forEach((page, index) => {
    const hit = frames.includes(page);
    let replacedPage = null;

    if (!hit) {
      if (frames.length < frameCount) {
        frames.push(page);
        queue.push(page);
      } else {
        replacedPage = queue.shift();
        const replaceIndex = frames.indexOf(replacedPage);
        frames[replaceIndex] = page;
        queue.push(page);
      }
    }

    steps.push(createStep(index, page, frames, hit, replacedPage));
  });

  return steps;
}

function runLRU(pages, frameCount) {
  const frames = [];
  const lastUsed = new Map();
  const steps = [];

  pages.forEach((page, index) => {
    const hit = frames.includes(page);
    let replacedPage = null;

    if (!hit) {
      if (frames.length < frameCount) {
        frames.push(page);
      } else {
        replacedPage = findLeastRecentlyUsedPage(frames, lastUsed);
        const replaceIndex = frames.indexOf(replacedPage);
        frames[replaceIndex] = page;
      }
    }

    lastUsed.set(page, index);
    steps.push(createStep(index, page, frames, hit, replacedPage));
  });

  return steps;
}

function runOptimal(pages, frameCount) {
  const frames = [];
  const steps = [];

  pages.forEach((page, index) => {
    const hit = frames.includes(page);
    let replacedPage = null;

    if (!hit) {
      if (frames.length < frameCount) {
        frames.push(page);
      } else {
        replacedPage = findOptimalPageToReplace(frames, pages, index + 1);
        const replaceIndex = frames.indexOf(replacedPage);
        frames[replaceIndex] = page;
      }
    }

    steps.push(createStep(index, page, frames, hit, replacedPage));
  });

  return steps;
}

async function renderSimulationStep(step, pages, frameCount) {
  currentRequestText.textContent = `Current request: ${step.page}`;
  renderReferenceStrip(pages, step.index);
  renderFrames(step, frameCount);

  stepResult.className = step.hit ? "step-result is-hit" : "step-result is-fault";
  stepResult.textContent = step.hit
    ? `Page ${step.page} is already in memory. Hit.`
    : `Page ${step.page} caused a fault.${step.replacedPage === null ? "" : ` Replaced ${step.replacedPage}.`}`;

  appendHistoryRow(step);
  await sleep(getAnimationDelay());
}

function calculateStats(steps) {
  const faults = steps.filter((step) => !step.hit).length;
  const hits = steps.length - faults;

  return {
    faults,
    hits,
    faultRatio: faults / steps.length,
    hitRatio: hits / steps.length,
  };
}

async function runSimulation() {
  if (isAnimating) {
    return;
  }

  const pages = parseReferenceString();

  if (!pages) {
    return;
  }

  const frameCount = Number(frameCountInput.value);

  if (!Number.isInteger(frameCount) || frameCount < 1) {
    setMessage("Frame count must be a whole number greater than 0.");
    return;
  }

  const steps = runSelectedAlgorithm(pages, frameCount);
  const runId = activeRunId + 1;

  activeRunId = runId;
  isAnimating = true;
  setControlsDisabled(true);
  clearOutput();
  historyBody.innerHTML = "";
  setMessage(`Running ${getAlgorithmLabel()}...`);

  for (const step of steps) {
    if (runId !== activeRunId) {
      return;
    }

    await renderSimulationStep(step, pages, frameCount);
  }

  renderStats(calculateStats(steps));
  currentRequestText.textContent = "Current request: complete";
  setMessage(`${getAlgorithmLabel()} simulation complete.`);
  isAnimating = false;
  setControlsDisabled(false);
}

function runSelectedAlgorithm(pages, frameCount) {
  if (algorithmSelect.value === "lru") {
    return runLRU(pages, frameCount);
  }

  if (algorithmSelect.value === "optimal") {
    return runOptimal(pages, frameCount);
  }

  return runFIFO(pages, frameCount);
}

function createStep(index, page, frames, hit, replacedPage) {
  return {
    index,
    page,
    frames: [...frames],
    hit,
    replacedPage,
  };
}

function findLeastRecentlyUsedPage(frames, lastUsed) {
  let selectedPage = frames[0];
  let oldestUse = lastUsed.get(selectedPage) ?? -1;

  frames.forEach((page) => {
    const pageLastUsed = lastUsed.get(page) ?? -1;

    if (pageLastUsed < oldestUse) {
      selectedPage = page;
      oldestUse = pageLastUsed;
    }
  });

  return selectedPage;
}

function findOptimalPageToReplace(frames, pages, startIndex) {
  let selectedPage = frames[0];
  let farthestNextUse = -1;

  frames.forEach((page) => {
    const nextUseIndex = pages.indexOf(page, startIndex);

    if (nextUseIndex === -1) {
      selectedPage = page;
      farthestNextUse = Infinity;
      return;
    }

    if (nextUseIndex > farthestNextUse) {
      selectedPage = page;
      farthestNextUse = nextUseIndex;
    }
  });

  return selectedPage;
}

function renderReferenceStrip(pages, activeIndex) {
  referenceStrip.innerHTML = "";

  pages.forEach((page, index) => {
    const item = document.createElement("div");

    item.className = index === activeIndex ? "reference-item is-active" : "reference-item";
    item.textContent = page;
    referenceStrip.appendChild(item);
  });
}

function renderFrames(step, frameCount) {
  framesView.innerHTML = "";

  for (let index = 0; index < frameCount; index += 1) {
    const page = step.frames[index];
    const frame = document.createElement("div");
    const isCurrentPage = page === step.page;
    const isReplacedPage = page === step.replacedPage;

    frame.className = "frame-cell";

    if (page !== undefined) {
      frame.classList.add("is-filled");
    }

    if (isCurrentPage) {
      frame.classList.add("is-current");
    }

    if (isReplacedPage || (step.replacedPage !== null && isCurrentPage)) {
      frame.classList.add("is-replaced");
    }

    frame.textContent = page === undefined ? "Empty" : page;
    framesView.appendChild(frame);
  }
}

function appendHistoryRow(step) {
  const row = document.createElement("tr");
  const framesText = step.frames.join(", ");
  const resultClass = step.hit ? "hit-text" : "fault-text";
  const resultText = step.hit ? "Hit" : "Fault";

  row.innerHTML = `
    <td>${step.index + 1}</td>
    <td>${step.page}</td>
    <td>${framesText}</td>
    <td class="${resultClass}">${resultText}</td>
    <td>${step.replacedPage === null ? "--" : step.replacedPage}</td>
  `;

  historyBody.appendChild(row);
}

function renderStats(stats) {
  pageFaultsText.textContent = `Page faults: ${stats.faults}`;
  pageHitsText.textContent = `Page hits: ${stats.hits}`;
  faultRatioText.textContent = `Fault ratio: ${formatPercent(stats.faultRatio)}`;
  hitRatioText.textContent = `Hit ratio: ${formatPercent(stats.hitRatio)}`;
}

function clearOutput() {
  referenceStrip.innerHTML = "";
  framesView.innerHTML = "";
  historyBody.innerHTML = `
    <tr class="empty-row">
      <td colspan="5">Run a simulation to see each step.</td>
    </tr>
  `;
  stepResult.className = "step-result";
  stepResult.textContent = "Run a simulation to see each step.";
  currentRequestText.textContent = "Current request: none";
  pageFaultsText.textContent = "Page faults: --";
  pageHitsText.textContent = "Page hits: --";
  faultRatioText.textContent = "Fault ratio: --";
  hitRatioText.textContent = "Hit ratio: --";
}

function generateExample() {
  if (isAnimating) {
    return;
  }

  referenceInput.value = DEFAULT_REFERENCE_STRING;
  frameCountInput.value = "3";
  algorithmSelect.value = "fifo";
  speedControl.value = "65";
  clearOutput();
  setMessage("Example loaded.");
}

function resetVisualizer() {
  if (isAnimating) {
    return;
  }

  referenceInput.value = "";
  frameCountInput.value = "3";
  algorithmSelect.value = "fifo";
  speedControl.value = "65";
  clearOutput();
  setMessage("Visualizer reset.");
}

function setControlsDisabled(shouldDisable) {
  controls.forEach((control) => {
    control.disabled = shouldDisable;
  });
}

function setMessage(message) {
  statusMessage.textContent = message;
}

function getAlgorithmLabel() {
  const labels = {
    fifo: "FIFO",
    lru: "LRU",
    optimal: "Optimal",
  };

  return labels[algorithmSelect.value];
}

function getAnimationDelay() {
  const speed = Number(speedControl.value);

  return Math.max(80, 720 - speed * 6);
}

function formatPercent(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function sleep(delayInMilliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delayInMilliseconds);
  });
}

runButton.addEventListener("click", runSimulation);
exampleButton.addEventListener("click", generateExample);
resetButton.addEventListener("click", resetVisualizer);

clearOutput();
