# AlgoLab: Interactive CS Visualizer Suite

AlgoLab is a portfolio-ready vanilla web app for exploring algorithms, data structures, operating systems, and database design concepts through interactive visualizers.

## Description

The project is built with plain HTML, CSS, and JavaScript. It does not use frameworks, external libraries, npm packages, or build tooling. Each visualizer is intentionally organized as a small, readable module so the implementation can be studied by beginners.

## Features

- Responsive dark tech-style interface
- Interactive algorithm controls
- Animated algorithm steps
- Helpful validation and empty states
- Beginner-friendly JavaScript structure
- Static-site friendly deployment

## Visualizers Included

- Pathfinding Visualizer: BFS, Dijkstra, and A* search
- Sorting Algorithm Visualizer: Bubble, Selection, Insertion, Merge, and Quick Sort
- Graph Algorithm Visualizer: BFS, DFS, and shortest path using BFS
- Binary Search Tree Visualizer: insert, search, delete, and traversals
- CPU Scheduling Visualizer: FCFS, SJF, Round Robin, and Priority Scheduling
- Page Replacement Visualizer: FIFO, LRU, and Optimal
- ERD to SQL Visualizer: planned module

## Tech Stack

- HTML
- CSS
- JavaScript
- No frameworks
- No external libraries
- No build tools

## Folder Structure

```text
algolab-visualizers/
|-- index.html
|-- README.md
|-- AGENTS.md
|-- css/
|   `-- style.css
|-- js/
|   `-- main.js
`-- visualizers/
    |-- pathfinding/
    |-- sorting/
    |-- graph/
    |-- tree/
    |-- os-scheduling/
    |-- page-replacement/
    `-- db-erd/
```

## Run Locally

Open `index.html` in a web browser.

No installation or build step is required.

## Deployment

This is a static site. It can be deployed with GitHub Pages, Vercel, Netlify, or any static hosting service.

To deploy on Vercel:

1. Push the project to GitHub.
2. Go to Vercel.
3. Import the GitHub repository.
4. Keep the framework preset as `Other` or a static project.
5. Set `algolab-visualizers` as the root directory if the repository contains other folders.
6. Deploy.
7. Vercel will provide a live URL.

Since this project uses only HTML, CSS, and JavaScript, no build command is needed.

## Future Improvements

- Weighted pathfinding grids
- Maze generation
- More sorting algorithms
- Export ERD as image
- Save/load visualizer states
- Dark/light mode toggle

## Author

Created by Alika Kabir as a portfolio-level computer science visualization project.

## Status

In development.
