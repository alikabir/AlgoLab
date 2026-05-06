# AGENTS.md

## Project

AlgoLab: Interactive CS Visualizer Suite is a portfolio-level vanilla web app for learning and demonstrating core computer science algorithms and systems concepts.

The planned visualizer modules are:

1. Pathfinding Visualizer
2. Sorting Algorithm Visualizer
3. Graph Algorithm Visualizer
4. Binary Search Tree Visualizer
5. CPU Scheduling Visualizer
6. Page Replacement Visualizer
7. ERD to SQL Visualizer

## Technology Rules

- Use HTML, CSS, and JavaScript.
- Do not use frameworks.
- Do not use external libraries.
- Do not use React, Vue, Angular, Tailwind, Bootstrap, or npm packages.
- Do not add build tools unless they are absolutely necessary and the user approves.
- Keep the app easy to run as a static site.

## Workflow Rules

- Work phase by phase.
- Do not build the full app at once.
- Only implement what the user asks for in the current prompt.
- Before editing, inspect the current files.
- After editing, explain exactly what changed.
- Mention every file created or modified.
- Make sure existing pages still work after changes.
- Do not remove working features unless the user explicitly asks.

## Code Style

- Keep the code beginner-friendly and well-commented.
- Prefer small, understandable functions.
- Use clear, descriptive names for variables and functions.
- Avoid messy global variables where possible.
- Group related behavior into focused files and functions.
- Prefer simple browser APIs over clever abstractions.
- Add comments where they help explain learning-oriented algorithm logic.
- Do not over-comment obvious code.

## File Organization

- Keep file organization clean and predictable.
- Use separate folders for CSS, JavaScript, and visualizer modules when the app grows.
- Keep shared utilities separate from visualizer-specific logic.
- Avoid large files that mix unrelated features.

## UI Standards

- The UI should be modern, clean, responsive, and portfolio-worthy.
- Build actual usable visualizer screens, not a marketing landing page, unless the user asks for one.
- Keep layouts readable on mobile and desktop.
- Use consistent spacing, typography, colors, and controls.
- Make controls clear and accessible with labels or helpful button text.

## Quality Checks

- Verify that existing pages and interactions still work after each change.
- For visual work, check responsive behavior and obvious layout issues.
- Prefer small, focused manual tests for each implemented feature.
- Report any checks that could not be run.

