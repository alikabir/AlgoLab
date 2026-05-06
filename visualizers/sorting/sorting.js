// Sorting visualizer state and animations.
// Bubble, Selection, Insertion, Merge, and Quick Sort are implemented.

const DEFAULT_ARRAY_SIZE = 40;
const MIN_VALUE = 8;
const MAX_VALUE = 100;

const BAR_STATES = {
  NORMAL: "normal",
  COMPARED: "compared",
  SWAPPED: "swapped",
  PIVOT: "pivot",
  SORTED: "sorted",
};

const arrayContainer = document.querySelector("#array-container");
const algorithmSelect = document.querySelector("#algorithm-select");
const algorithmInfo = document.querySelector("#algorithm-info");
const arraySizeSlider = document.querySelector("#array-size");
const speedSlider = document.querySelector("#animation-speed");
const arraySizeValue = document.querySelector("#array-size-value");
const speedValue = document.querySelector("#speed-value");
const generateArrayButton = document.querySelector("#generate-array-button");
const startSortingButton = document.querySelector("#start-sorting-button");
const resetButton = document.querySelector("#reset-button");
const statusMessage = document.querySelector("#status-message");

const controls = [
  algorithmSelect,
  arraySizeSlider,
  speedSlider,
  generateArrayButton,
  startSortingButton,
  resetButton,
];

const ALGORITHM_INFO = {
  bubble: "Bubble Sort compares neighbors repeatedly. Average time: O(n^2).",
  selection: "Selection Sort repeatedly selects the smallest remaining value. Average time: O(n^2).",
  insertion: "Insertion Sort inserts each value into the sorted left side. Average time: O(n^2).",
  merge: "Merge Sort splits the array and merges sorted halves. Average time: O(n log n).",
  quick: "Quick Sort partitions around a pivot. Average time: O(n log n).",
};

let numbers = [];
let barStates = [];
let isAnimating = false;
let activeRunId = 0;

function generateRandomArray(size) {
  const nextNumbers = [];

  for (let index = 0; index < size; index += 1) {
    nextNumbers.push(getRandomNumber(MIN_VALUE, MAX_VALUE));
  }

  numbers = nextNumbers;
  barStates = numbers.map(() => BAR_STATES.NORMAL);
  renderBars();
  setMessage(`Generated ${size} bars.`);
}

function getRandomNumber(minimum, maximum) {
  return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

function renderBars() {
  arrayContainer.innerHTML = "";

  numbers.forEach((number, index) => {
    const bar = document.createElement("div");

    bar.className = `array-bar bar-${barStates[index]}`;
    bar.style.height = `${number}%`;
    bar.title = String(number);
    bar.setAttribute("aria-label", `Array value ${number}`);

    arrayContainer.appendChild(bar);
  });
}

function disableControls() {
  controls.forEach((control) => {
    control.disabled = true;
  });
}

function enableControls() {
  controls.forEach((control) => {
    control.disabled = false;
  });
}

function updateSliderLabels() {
  arraySizeValue.textContent = arraySizeSlider.value;
  speedValue.textContent = speedSlider.value;
}

function handleArraySizeChange() {
  if (isAnimating) {
    return;
  }

  updateSliderLabels();
  generateRandomArray(Number(arraySizeSlider.value));
}

function handleSpeedChange() {
  updateSliderLabels();
}

function handleGenerateArray() {
  if (isAnimating) {
    return;
  }

  generateRandomArray(Number(arraySizeSlider.value));
}

function handleStartSorting() {
  if (isAnimating) {
    return;
  }

  startSelectedSort();
}

async function startSelectedSort() {
  isAnimating = true;
  activeRunId += 1;
  const runId = activeRunId;

  disableControls();
  resetBarStates(BAR_STATES.NORMAL);
  renderBars();
  setMessage(`Running ${getAlgorithmLabel()}...`);

  if (algorithmSelect.value === "bubble") {
    await bubbleSort(runId);
  }

  if (algorithmSelect.value === "selection") {
    await selectionSort(runId);
  }

  if (algorithmSelect.value === "insertion") {
    await insertionSort(runId);
  }

  if (algorithmSelect.value === "merge") {
    await mergeSort(0, numbers.length - 1, runId);
  }

  if (algorithmSelect.value === "quick") {
    await quickSort(0, numbers.length - 1, runId);
  }

  if (isCurrentRun(runId)) {
    markAllBarsSorted();
    setMessage(`${getAlgorithmLabel()} complete.`);
  }

  isAnimating = false;
  enableControls();
}

function handleReset() {
  if (isAnimating) {
    return;
  }

  arraySizeSlider.value = String(DEFAULT_ARRAY_SIZE);
  updateSliderLabels();
  generateRandomArray(DEFAULT_ARRAY_SIZE);
  setMessage("Array reset to the default size.");
}

function setMessage(message) {
  statusMessage.textContent = message;
}

async function bubbleSort(runId) {
  for (let pass = 0; pass < numbers.length - 1; pass += 1) {
    for (let index = 0; index < numbers.length - pass - 1; index += 1) {
      await showComparedBars(index, index + 1, runId);

      if (!isCurrentRun(runId)) {
        return;
      }

      if (numbers[index] > numbers[index + 1]) {
        await swapBars(index, index + 1, runId);
      }
    }

    markBarSorted(numbers.length - pass - 1);
  }

  markBarSorted(0);
}

async function selectionSort(runId) {
  for (let startIndex = 0; startIndex < numbers.length - 1; startIndex += 1) {
    let smallestIndex = startIndex;

    for (let scanIndex = startIndex + 1; scanIndex < numbers.length; scanIndex += 1) {
      await showComparedBars(smallestIndex, scanIndex, runId);

      if (!isCurrentRun(runId)) {
        return;
      }

      if (numbers[scanIndex] < numbers[smallestIndex]) {
        smallestIndex = scanIndex;
      }
    }

    if (smallestIndex !== startIndex) {
      await swapBars(startIndex, smallestIndex, runId);
    }

    markBarSorted(startIndex);
  }

  markBarSorted(numbers.length - 1);
}

async function insertionSort(runId) {
  markBarSorted(0);

  for (let index = 1; index < numbers.length; index += 1) {
    let currentIndex = index;

    while (currentIndex > 0) {
      await showComparedBars(currentIndex - 1, currentIndex, runId);

      if (!isCurrentRun(runId)) {
        return;
      }

      if (numbers[currentIndex - 1] <= numbers[currentIndex]) {
        break;
      }

      await swapBars(currentIndex - 1, currentIndex, runId);
      currentIndex -= 1;
    }

    markSortedPrefix(index);
  }
}

async function mergeSort(leftIndex, rightIndex, runId) {
  if (!isCurrentRun(runId) || leftIndex >= rightIndex) {
    return;
  }

  const middleIndex = Math.floor((leftIndex + rightIndex) / 2);

  // Recursively sort the left half, then the right half, before merging them.
  await mergeSort(leftIndex, middleIndex, runId);
  await mergeSort(middleIndex + 1, rightIndex, runId);
  await mergeSortedSections(leftIndex, middleIndex, rightIndex, runId);
}

async function mergeSortedSections(leftIndex, middleIndex, rightIndex, runId) {
  const leftValues = numbers.slice(leftIndex, middleIndex + 1);
  const rightValues = numbers.slice(middleIndex + 1, rightIndex + 1);
  let leftPointer = 0;
  let rightPointer = 0;
  let writeIndex = leftIndex;

  while (leftPointer < leftValues.length && rightPointer < rightValues.length) {
    await showComparedBars(leftIndex + leftPointer, middleIndex + 1 + rightPointer, runId);

    if (!isCurrentRun(runId)) {
      return;
    }

    if (leftValues[leftPointer] <= rightValues[rightPointer]) {
      await overwriteBar(writeIndex, leftValues[leftPointer], runId);
      leftPointer += 1;
    } else {
      await overwriteBar(writeIndex, rightValues[rightPointer], runId);
      rightPointer += 1;
    }

    writeIndex += 1;
  }

  while (leftPointer < leftValues.length) {
    await overwriteBar(writeIndex, leftValues[leftPointer], runId);
    leftPointer += 1;
    writeIndex += 1;
  }

  while (rightPointer < rightValues.length) {
    await overwriteBar(writeIndex, rightValues[rightPointer], runId);
    rightPointer += 1;
    writeIndex += 1;
  }
}

async function quickSort(lowIndex, highIndex, runId) {
  if (!isCurrentRun(runId) || lowIndex > highIndex) {
    return;
  }

  if (lowIndex === highIndex) {
    markBarSorted(lowIndex);
    return;
  }

  // Partition places the pivot in its final sorted position.
  const pivotIndex = await partition(lowIndex, highIndex, runId);

  if (!isCurrentRun(runId)) {
    return;
  }

  markBarSorted(pivotIndex);
  await quickSort(lowIndex, pivotIndex - 1, runId);
  await quickSort(pivotIndex + 1, highIndex, runId);
}

async function partition(lowIndex, highIndex, runId) {
  const pivotValue = numbers[highIndex];
  let smallerIndex = lowIndex - 1;

  await showPivotBar(highIndex, runId);

  for (let scanIndex = lowIndex; scanIndex < highIndex; scanIndex += 1) {
    await showPivotAndComparedBars(highIndex, scanIndex, runId);

    if (!isCurrentRun(runId)) {
      return highIndex;
    }

    if (numbers[scanIndex] <= pivotValue) {
      smallerIndex += 1;

      if (smallerIndex !== scanIndex) {
        await swapBars(smallerIndex, scanIndex, runId);
        await showPivotBar(highIndex, runId);
      }
    }
  }

  await swapBars(smallerIndex + 1, highIndex, runId);
  return smallerIndex + 1;
}

async function showComparedBars(firstIndex, secondIndex, runId) {
  if (!isCurrentRun(runId)) {
    return;
  }

  clearActiveBarStates();
  barStates[firstIndex] = BAR_STATES.COMPARED;
  barStates[secondIndex] = BAR_STATES.COMPARED;
  renderBars();
  await sleep();
}

async function showPivotBar(pivotIndex, runId) {
  if (!isCurrentRun(runId)) {
    return;
  }

  clearActiveBarStates();
  barStates[pivotIndex] = BAR_STATES.PIVOT;
  renderBars();
  await sleep();
}

async function showPivotAndComparedBars(pivotIndex, comparedIndex, runId) {
  if (!isCurrentRun(runId)) {
    return;
  }

  clearActiveBarStates();
  barStates[pivotIndex] = BAR_STATES.PIVOT;
  barStates[comparedIndex] = BAR_STATES.COMPARED;
  renderBars();
  await sleep();
}

async function swapBars(firstIndex, secondIndex, runId) {
  if (!isCurrentRun(runId)) {
    return;
  }

  const temporaryValue = numbers[firstIndex];
  numbers[firstIndex] = numbers[secondIndex];
  numbers[secondIndex] = temporaryValue;

  clearActiveBarStates();
  barStates[firstIndex] = BAR_STATES.SWAPPED;
  barStates[secondIndex] = BAR_STATES.SWAPPED;
  renderBars();
  await sleep();
}

async function overwriteBar(index, nextValue, runId) {
  if (!isCurrentRun(runId)) {
    return;
  }

  numbers[index] = nextValue;
  clearActiveBarStates();
  barStates[index] = BAR_STATES.SWAPPED;
  renderBars();
  await sleep();
}

function clearActiveBarStates() {
  barStates = barStates.map((state) => {
    if (state === BAR_STATES.SORTED) {
      return BAR_STATES.SORTED;
    }

    return BAR_STATES.NORMAL;
  });
}

function resetBarStates(state) {
  barStates = numbers.map(() => state);
}

function markBarSorted(index) {
  barStates[index] = BAR_STATES.SORTED;
  renderBars();
}

function markSortedPrefix(lastIndex) {
  for (let index = 0; index <= lastIndex; index += 1) {
    barStates[index] = BAR_STATES.SORTED;
  }

  renderBars();
}

function markAllBarsSorted() {
  resetBarStates(BAR_STATES.SORTED);
  renderBars();
}

function sleep() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, getAnimationDelay());
  });
}

function getAnimationDelay() {
  const speed = Number(speedSlider.value);

  return Math.max(4, 90 - speed * 1.2);
}

function getAlgorithmLabel() {
  const labels = {
    bubble: "Bubble Sort",
    selection: "Selection Sort",
    insertion: "Insertion Sort",
    merge: "Merge Sort",
    quick: "Quick Sort",
  };

  return labels[algorithmSelect.value] || "Selected algorithm";
}

function isCurrentRun(runId) {
  return runId === activeRunId;
}

function updateAlgorithmInfo() {
  algorithmInfo.textContent = ALGORITHM_INFO[algorithmSelect.value];
}

arraySizeSlider.addEventListener("input", handleArraySizeChange);
speedSlider.addEventListener("input", handleSpeedChange);
algorithmSelect.addEventListener("change", updateAlgorithmInfo);
generateArrayButton.addEventListener("click", handleGenerateArray);
startSortingButton.addEventListener("click", handleStartSorting);
resetButton.addEventListener("click", handleReset);

updateSliderLabels();
updateAlgorithmInfo();
generateRandomArray(DEFAULT_ARRAY_SIZE);
