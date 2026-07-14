# About the Project (Interview Summary)

*This project is designed to showcase core web fundamentals (HTML5, CSS3, ES5/ES6 vanilla JS) without relying on heavy frontend frameworks or build steps.*

> TaskFlow is a client-side task tracker I built as a web technology project. It's a Kanban board — three columns for To Do, In Progress, and Done — where users can create tasks with titles, deadlines, priorities, and categories, then move them through the workflow.
>
> The core technical decisions: I used vanilla JavaScript with no frameworks, which let me keep the project at three files (HTML, CSS, JS) with zero build step. Data persistence uses the browser's localStorage API — tasks are serialized as JSON and re-parsed on page load. The rendering approach is a simple "clear and rebuild" cycle: every time the task array changes, I wipe the column DOM and rebuild all task cards from the array. This is intentionally naive — for a few dozen tasks the performance is fine, and it avoids the complexity of a virtual DOM diffing system.
>
> The main tradeoff I chose was localStorage over a backend database. This means the app works instantly with no server, no auth, and no hosting cost beyond static hosts like Vercel or GitHub Pages — but tasks don't sync across devices. For a personal task tracker that's an acceptable limitation, and I documented it clearly in the README.
