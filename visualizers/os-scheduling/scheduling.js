// CPU Scheduling Visualizer.
// Algorithms are written plainly so each scheduling decision is easy to follow.

const GANTT_DELAY_MS = 450;

const processIdInput = document.querySelector("#process-id");
const arrivalTimeInput = document.querySelector("#arrival-time");
const burstTimeInput = document.querySelector("#burst-time");
const priorityInput = document.querySelector("#priority");
const algorithmSelect = document.querySelector("#algorithm-select");
const quantumInput = document.querySelector("#quantum");
const addProcessButton = document.querySelector("#add-process-button");
const exampleButton = document.querySelector("#example-button");
const runButton = document.querySelector("#run-button");
const resetButton = document.querySelector("#reset-button");
const processTableBody = document.querySelector("#process-table-body");
const metricsTableBody = document.querySelector("#metrics-table-body");
const ganttChart = document.querySelector("#gantt-chart");
const statusMessage = document.querySelector("#status-message");
const currentProcessText = document.querySelector("#current-process");
const averageWaitingTimeText = document.querySelector("#average-waiting-time");
const averageTurnaroundTimeText = document.querySelector("#average-turnaround-time");

const controls = [
  processIdInput,
  arrivalTimeInput,
  burstTimeInput,
  priorityInput,
  algorithmSelect,
  quantumInput,
  addProcessButton,
  exampleButton,
  runButton,
  resetButton,
];

let processes = [];
let isAnimating = false;

function addProcess() {
  if (isAnimating) {
    return;
  }

  const process = readProcessFromInputs();

  if (!process) {
    return;
  }

  processes.push(process);
  renderProcessTable();
  clearSimulationOutput();
  setMessage(`${process.id} added.`);
  prepareNextProcessId();
}

function readProcessFromInputs() {
  const id = processIdInput.value.trim() || `P${processes.length + 1}`;
  const arrivalTime = Number(arrivalTimeInput.value);
  const burstTime = Number(burstTimeInput.value);
  const priority = Number(priorityInput.value);

  if (processes.some((process) => process.id.toLowerCase() === id.toLowerCase())) {
    setMessage("Process ID must be unique.");
    return null;
  }

  if (!Number.isInteger(arrivalTime) || arrivalTime < 0) {
    setMessage("Arrival time must be a whole number 0 or greater.");
    return null;
  }

  if (!Number.isInteger(burstTime) || burstTime <= 0) {
    setMessage("Burst time must be a whole number greater than 0.");
    return null;
  }

  if (!Number.isInteger(priority) || priority <= 0) {
    setMessage("Priority must be a whole number greater than 0.");
    return null;
  }

  return {
    id,
    arrivalTime,
    burstTime,
    priority,
    order: processes.length,
  };
}

function renderProcessTable() {
  processTableBody.innerHTML = "";

  if (processes.length === 0) {
    processTableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="4">No processes added yet.</td>
      </tr>
    `;
    return;
  }

  processes.forEach((process) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${process.id}</td>
      <td>${process.arrivalTime}</td>
      <td>${process.burstTime}</td>
      <td>${process.priority}</td>
    `;

    processTableBody.appendChild(row);
  });
}

function runFCFS() {
  const orderedProcesses = [...processes].sort(compareByArrivalThenOrder);
  const completionTimes = new Map();
  const segments = [];
  let currentTime = 0;

  orderedProcesses.forEach((process) => {
    currentTime = addIdleTimeIfNeeded(segments, currentTime, process.arrivalTime);

    const startTime = currentTime;
    const endTime = startTime + process.burstTime;

    segments.push(createSegment(process.id, startTime, endTime));
    completionTimes.set(process.id, endTime);
    currentTime = endTime;
  });

  return { segments, metrics: calculateMetrics(completionTimes) };
}

function runSJF() {
  const remainingProcesses = [...processes];
  const completionTimes = new Map();
  const segments = [];
  let currentTime = 0;

  while (remainingProcesses.length > 0) {
    const availableProcesses = remainingProcesses.filter((process) => process.arrivalTime <= currentTime);

    if (availableProcesses.length === 0) {
      const nextArrival = Math.min(...remainingProcesses.map((process) => process.arrivalTime));
      currentTime = addIdleTimeIfNeeded(segments, currentTime, nextArrival);
      continue;
    }

    availableProcesses.sort((first, second) => {
      if (first.burstTime !== second.burstTime) {
        return first.burstTime - second.burstTime;
      }

      return compareByArrivalThenOrder(first, second);
    });

    const selectedProcess = availableProcesses[0];
    removeProcessById(remainingProcesses, selectedProcess.id);

    const startTime = currentTime;
    const endTime = startTime + selectedProcess.burstTime;

    segments.push(createSegment(selectedProcess.id, startTime, endTime));
    completionTimes.set(selectedProcess.id, endTime);
    currentTime = endTime;
  }

  return { segments, metrics: calculateMetrics(completionTimes) };
}

function runRoundRobin() {
  const quantum = Number(quantumInput.value);

  if (!Number.isInteger(quantum) || quantum <= 0) {
    setMessage("Round Robin quantum must be a whole number greater than 0.");
    return null;
  }

  const orderedProcesses = [...processes].sort(compareByArrivalThenOrder);
  const remainingTimes = new Map(orderedProcesses.map((process) => [process.id, process.burstTime]));
  const completionTimes = new Map();
  const queue = [];
  const segments = [];
  let currentTime = 0;
  let nextProcessIndex = 0;

  while (completionTimes.size < orderedProcesses.length) {
    while (
      nextProcessIndex < orderedProcesses.length &&
      orderedProcesses[nextProcessIndex].arrivalTime <= currentTime
    ) {
      queue.push(orderedProcesses[nextProcessIndex]);
      nextProcessIndex += 1;
    }

    if (queue.length === 0) {
      const nextProcess = orderedProcesses[nextProcessIndex];
      currentTime = addIdleTimeIfNeeded(segments, currentTime, nextProcess.arrivalTime);
      continue;
    }

    const process = queue.shift();
    const runTime = Math.min(quantum, remainingTimes.get(process.id));
    const startTime = currentTime;
    const endTime = startTime + runTime;

    segments.push(createSegment(process.id, startTime, endTime));
    currentTime = endTime;
    remainingTimes.set(process.id, remainingTimes.get(process.id) - runTime);

    while (
      nextProcessIndex < orderedProcesses.length &&
      orderedProcesses[nextProcessIndex].arrivalTime <= currentTime
    ) {
      queue.push(orderedProcesses[nextProcessIndex]);
      nextProcessIndex += 1;
    }

    if (remainingTimes.get(process.id) > 0) {
      queue.push(process);
    } else {
      completionTimes.set(process.id, currentTime);
    }
  }

  return { segments, metrics: calculateMetrics(completionTimes) };
}

function runPriority() {
  const remainingProcesses = [...processes];
  const completionTimes = new Map();
  const segments = [];
  let currentTime = 0;

  while (remainingProcesses.length > 0) {
    const availableProcesses = remainingProcesses.filter((process) => process.arrivalTime <= currentTime);

    if (availableProcesses.length === 0) {
      const nextArrival = Math.min(...remainingProcesses.map((process) => process.arrivalTime));
      currentTime = addIdleTimeIfNeeded(segments, currentTime, nextArrival);
      continue;
    }

    availableProcesses.sort((first, second) => {
      if (first.priority !== second.priority) {
        return first.priority - second.priority;
      }

      return compareByArrivalThenOrder(first, second);
    });

    const selectedProcess = availableProcesses[0];
    removeProcessById(remainingProcesses, selectedProcess.id);

    const startTime = currentTime;
    const endTime = startTime + selectedProcess.burstTime;

    segments.push(createSegment(selectedProcess.id, startTime, endTime));
    completionTimes.set(selectedProcess.id, endTime);
    currentTime = endTime;
  }

  return { segments, metrics: calculateMetrics(completionTimes) };
}

function calculateMetrics(completionTimes) {
  return processes
    .map((process) => {
      const completionTime = completionTimes.get(process.id);
      const turnaroundTime = completionTime - process.arrivalTime;
      const waitingTime = turnaroundTime - process.burstTime;

      return {
        id: process.id,
        completionTime,
        turnaroundTime,
        waitingTime,
      };
    })
    .sort((first, second) => {
      const firstProcess = processes.find((process) => process.id === first.id);
      const secondProcess = processes.find((process) => process.id === second.id);

      return firstProcess.order - secondProcess.order;
    });
}

async function renderGanttChart(segments) {
  ganttChart.innerHTML = "";

  for (const segment of segments) {
    currentProcessText.textContent = segment.isIdle
      ? "Current process: CPU idle"
      : `Current process: ${segment.processId}`;

    const block = document.createElement("div");
    block.className = segment.isIdle ? "gantt-block is-idle" : "gantt-block";
    block.innerHTML = `
      <span class="gantt-process">${segment.processId}</span>
      <span class="gantt-time">${segment.startTime} - ${segment.endTime}</span>
    `;

    ganttChart.appendChild(block);
    await sleep(GANTT_DELAY_MS);
  }

  currentProcessText.textContent = "Current process: complete";
}

function renderMetrics(metrics) {
  metricsTableBody.innerHTML = "";

  if (metrics.length === 0) {
    metricsTableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="4">Run a simulation to see metrics.</td>
      </tr>
    `;
    averageWaitingTimeText.textContent = "Average waiting time: --";
    averageTurnaroundTimeText.textContent = "Average turnaround time: --";
    return;
  }

  const totalWaitingTime = metrics.reduce((sum, metric) => sum + metric.waitingTime, 0);
  const totalTurnaroundTime = metrics.reduce((sum, metric) => sum + metric.turnaroundTime, 0);
  const averageWaitingTime = totalWaitingTime / metrics.length;
  const averageTurnaroundTime = totalTurnaroundTime / metrics.length;

  metrics.forEach((metric) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${metric.id}</td>
      <td>${metric.completionTime}</td>
      <td>${metric.turnaroundTime}</td>
      <td>${metric.waitingTime}</td>
    `;

    metricsTableBody.appendChild(row);
  });

  averageWaitingTimeText.textContent = `Average waiting time: ${formatNumber(averageWaitingTime)}`;
  averageTurnaroundTimeText.textContent = `Average turnaround time: ${formatNumber(averageTurnaroundTime)}`;
}

async function runSimulation() {
  if (isAnimating) {
    return;
  }

  if (processes.length === 0) {
    setMessage("Add at least one process before running a simulation.");
    return;
  }

  const result = runSelectedAlgorithm();

  if (!result) {
    return;
  }

  isAnimating = true;
  setControlsDisabled(true);
  clearSimulationOutput();
  setMessage(`Running ${getAlgorithmLabel()}...`);
  renderMetrics(result.metrics);
  await renderGanttChart(result.segments);
  setMessage(`${getAlgorithmLabel()} simulation complete.`);
  setControlsDisabled(false);
  isAnimating = false;
}

function runSelectedAlgorithm() {
  if (algorithmSelect.value === "sjf") {
    return runSJF();
  }

  if (algorithmSelect.value === "round-robin") {
    return runRoundRobin();
  }

  if (algorithmSelect.value === "priority") {
    return runPriority();
  }

  return runFCFS();
}

function generateExample() {
  if (isAnimating) {
    return;
  }

  processes = [
    { id: "P1", arrivalTime: 0, burstTime: 5, priority: 2, order: 0 },
    { id: "P2", arrivalTime: 1, burstTime: 3, priority: 1, order: 1 },
    { id: "P3", arrivalTime: 2, burstTime: 8, priority: 4, order: 2 },
    { id: "P4", arrivalTime: 3, burstTime: 6, priority: 3, order: 3 },
  ];

  processIdInput.value = "P5";
  arrivalTimeInput.value = "4";
  burstTimeInput.value = "4";
  priorityInput.value = "2";
  renderProcessTable();
  clearSimulationOutput();
  setMessage("Example processes generated.");
}

function resetVisualizer() {
  if (isAnimating) {
    return;
  }

  processes = [];
  processIdInput.value = "P1";
  arrivalTimeInput.value = "0";
  burstTimeInput.value = "4";
  priorityInput.value = "1";
  quantumInput.value = "2";
  algorithmSelect.value = "fcfs";
  renderProcessTable();
  clearSimulationOutput();
  setMessage("Visualizer reset.");
}

function clearSimulationOutput() {
  ganttChart.innerHTML = "";
  currentProcessText.textContent = "Current process: none";
  renderMetrics([]);
}

function setControlsDisabled(shouldDisable) {
  controls.forEach((control) => {
    control.disabled = shouldDisable;
  });
}

function setMessage(message) {
  statusMessage.textContent = message;
}

function prepareNextProcessId() {
  processIdInput.value = `P${processes.length + 1}`;
  burstTimeInput.value = "4";
  priorityInput.value = "1";
}

function createSegment(processId, startTime, endTime) {
  return {
    processId,
    startTime,
    endTime,
    isIdle: processId === "Idle",
  };
}

function addIdleTimeIfNeeded(segments, currentTime, nextArrivalTime) {
  if (currentTime < nextArrivalTime) {
    segments.push(createSegment("Idle", currentTime, nextArrivalTime));
    return nextArrivalTime;
  }

  return currentTime;
}

function removeProcessById(processList, processId) {
  const processIndex = processList.findIndex((process) => process.id === processId);

  if (processIndex !== -1) {
    processList.splice(processIndex, 1);
  }
}

function compareByArrivalThenOrder(first, second) {
  if (first.arrivalTime !== second.arrivalTime) {
    return first.arrivalTime - second.arrivalTime;
  }

  return first.order - second.order;
}

function getAlgorithmLabel() {
  const labels = {
    fcfs: "FCFS",
    sjf: "SJF",
    "round-robin": "Round Robin",
    priority: "Priority Scheduling",
  };

  return labels[algorithmSelect.value];
}

function formatNumber(number) {
  return Number.isInteger(number) ? String(number) : number.toFixed(2);
}

function sleep(delayInMilliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delayInMilliseconds);
  });
}

addProcessButton.addEventListener("click", addProcess);
exampleButton.addEventListener("click", generateExample);
runButton.addEventListener("click", runSimulation);
resetButton.addEventListener("click", resetVisualizer);

processIdInput.value = "P1";
renderProcessTable();
renderMetrics([]);
