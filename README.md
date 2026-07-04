# TaskFlow — Task Tracker

A task management board built for my Web Technology course project. Anyone can use it — just type your name on the first visit and start adding tasks. No sign-up or login needed, your data stays in your browser.

**Live site:** [saatvik-g.github.io/Task-Tracker](https://saatvik-g.github.io/Task-Tracker/)

---

## Features

| Feature | Status |
|---|---|
| First-visit welcome screen (asks your name) | ✅ |
| Personalized greeting (Good morning, [name]!) | ✅ |
| Add tasks with title, deadline and priority | ✅ |
| Move tasks: To Do → In Progress → Done | ✅ |
| Filter by category (Study, Assignment, Work, Personal, Health, Other) | ✅ |
| Filter by date (Today, This Week, Overdue) | ✅ |
| Search tasks by title or notes | ✅ |
| Dashboard with completion percentage | ✅ |
| Change name / Clear all data controls | ✅ |
| Data saved in browser localStorage (no backend) | ✅ |
| Responsive layout (works on mobile) | ✅ |

---

## Tech stack

- **HTML5** — semantic structure
- **CSS3** — custom dark theme, no frameworks
- **JavaScript** — vanilla JS, no libraries
- **Storage** — browser localStorage
- **Hosting** — GitHub Pages

---

## How to run locally

No install, no build step.

```bash
git clone https://github.com/Saatvik-G/Task-Tracker.git
cd Task-Tracker
# open index.html in your browser
```

Or use VS Code Live Server.

---

## How it works

1. **First visit** — a welcome card asks your name. This is saved in localStorage so you don't see it again.
2. **Dashboard** — three-column Kanban board (To Do, In Progress, Done). Add tasks with the "+ Add Task" button.
3. **Moving tasks** — each card has ▶ (start), ✔ (complete), or ↩ (reopen) buttons.
4. **Filters** — sidebar filters by category, header filters by due date, and there's a search bar.
5. **Stats** — progress ring and counters update live as you manage tasks.
6. **Your data** — everything stays in your browser. "Change name" and "Clear all data" options are in the sidebar.

---

## Why no login?

Since this is a client-side project hosted on GitHub Pages (static hosting, no server), there's no database. Each user's browser stores their own tasks via `localStorage`. This means:

- ✅ No account needed, works instantly
- ✅ Private — your tasks never leave your device
- ⚠️ Tasks don't sync across devices or browsers

---

## Project context

Built as part of the Web Technology internship project, July 2026.

**Built by Saatvik Gupta** — [GitHub](https://github.com/Saatvik-G)
