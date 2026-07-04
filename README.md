# Saat's Task Tracker

A personal task management board I built for my Web Technology course project. Lets me add tasks with deadlines and priorities, track them across three stages, and see how much I've knocked out.

**Live site:** [saatvik-g.github.io/Task-Tracker](https://saatvik-g.github.io/Task-Tracker/)

---

## What it does

| Requirement | Done? |
|---|---|
| Add tasks with a title, deadline and priority | ✅ |
| Mark tasks as To Do → In Progress → Done | ✅ |
| Filter by category (Study, Assignment, Personal, Health) | ✅ |
| Filter by date (Today, This Week, Overdue) | ✅ |
| Dashboard showing completion rate | ✅ |
| Search tasks by name or notes | ✅ |
| Data persists across page reloads (localStorage) | ✅ |

---

## Tech stack

- **HTML** — structure
- **CSS** — flat dark theme, hand-written (no frameworks)
- **JavaScript** — vanilla JS, no libraries
- **Storage** — browser localStorage (no backend)
- **Hosting** — GitHub Pages

---

## How to run locally

No install, no build step needed.

```bash
git clone https://github.com/Saatvik-G/Task-Tracker.git
cd Task-Tracker
# just open index.html in your browser
```

Or use VS Code Live Server if you have it.

---

## Features walkthrough

**Adding a task** — click "+ Add Task", fill in the title, pick a category and priority, set a due date, hit Save.

**Moving tasks** — each card has a ▶ button (start) or ✔ button (mark done). Done tasks get a strikethrough. Hit ↩ to reopen.

**Filtering** — sidebar has category filters. Header has a "Due:" dropdown for date-based filtering (Today / This week / Overdue). There's also a search box.

**Dashboard** — the sidebar shows a progress ring + total/active count that updates as you tick things off.

---

## Project context

Built as part of the Web Technology internship project, July 2026.

**Built by Saatvik Gupta** — [GitHub](https://github.com/Saatvik-G)
