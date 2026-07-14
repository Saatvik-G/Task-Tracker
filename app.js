// TaskFlow - app.js
// Built by Saatvik Gupta
// Web Tech Project — a client-side Kanban board using localStorage for persistence

document.addEventListener('DOMContentLoaded', function() {

    // =============================================
    //  WELCOME SCREEN
    //  On first visit, we ask for the user's name and store it in localStorage.
    //  On subsequent visits, we skip this and go straight to the app.
    // =============================================
    var welcomeScreen = document.getElementById('welcome-screen');
    var appContainer = document.getElementById('app-container');
    var welcomeNameInput = document.getElementById('welcome-name');
    var welcomeGoBtn = document.getElementById('welcome-go-btn');

    var savedName;
    try {
        savedName = localStorage.getItem('taskflow_username');
    } catch (e) {
        savedName = null;
    }

    if (savedName) {
        welcomeScreen.style.display = 'none';
        appContainer.classList.remove('hidden');
        appContainer.style.display = 'flex';
        initApp(savedName);
    } else {
        welcomeScreen.style.display = 'flex';
        appContainer.style.display = 'none';
        welcomeNameInput.focus();

        welcomeGoBtn.addEventListener('click', handleWelcome);
        welcomeNameInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') handleWelcome();
        });
    }

    function handleWelcome() {
        // Reset any previous validation styling before checking again
        welcomeNameInput.style.borderColor = '';

        var name = welcomeNameInput.value.trim();
        if (!name) {
            welcomeNameInput.style.borderColor = '#f06b7e';
            welcomeNameInput.focus();
            return;
        }
        localStorage.setItem('taskflow_username', name);
        welcomeScreen.classList.add('hide');

        // Wait for the CSS fade-out transition (300ms) before swapping visibility
        setTimeout(function() {
            welcomeScreen.style.display = 'none';
            appContainer.classList.remove('hidden');
            appContainer.style.display = 'flex';
            initApp(name);
        }, 300);
    }


    // =============================================
    //  MAIN APP
    //  Everything is wrapped in initApp() so DOM refs and state are scoped
    //  to a single invocation. This avoids polluting the global scope.
    // =============================================
    function initApp(userName) {

        // --- DOM references ---
        var greetingEl = document.getElementById('greeting');
        var currentDateEl = document.getElementById('current-date');
        var sidebarUsername = document.getElementById('sidebar-username');
        var addTaskBtn = document.getElementById('add-task-btn');
        var taskModal = document.getElementById('task-modal');
        var closeModalBtn = document.getElementById('close-modal');
        var cancelTaskBtn = document.getElementById('cancel-task');
        var taskForm = document.getElementById('task-form');
        var modalTitle = document.getElementById('modal-title');
        var modalBackdrop = document.getElementById('modal-backdrop');
        var changeNameBtn = document.getElementById('change-name-btn');
        var clearDataBtn = document.getElementById('clear-data-btn');

        // Form fields
        var taskIdInput = document.getElementById('task-id');
        var taskTitleInput = document.getElementById('task-title-input');
        var taskCategorySelect = document.getElementById('task-category');
        var taskPrioritySelect = document.getElementById('task-priority');
        var taskDueDateInput = document.getElementById('task-due-date');
        var taskDescInput = document.getElementById('task-desc');

        // Board column containers
        var listTodo = document.getElementById('list-todo');
        var listInProgress = document.getElementById('list-in-progress');
        var listDone = document.getElementById('list-done');

        // Column count badges
        var countTodoEl = document.getElementById('count-todo');
        var countProgressEl = document.getElementById('count-progress');
        var countDoneEl = document.getElementById('count-done');

        // Sidebar stat displays
        var statTotalEl = document.getElementById('stat-total');
        var statPendingEl = document.getElementById('stat-pending');
        var completionPercentageEl = document.getElementById('completion-percentage');
        var progressCircle = document.querySelector('.progress-ring__circle');

        // Filter controls
        var searchInput = document.getElementById('search-input');
        var filterButtons = document.querySelectorAll('.filter-btn');
        var dateFilterSelect = document.getElementById('date-filter');

        // --- SVG progress ring setup ---
        // The radius must match the r="46" attribute in the SVG element in index.html.
        // strokeDasharray = circumference makes the circle a single dash that wraps the
        // full perimeter. We then control how much is visible via strokeDashoffset.
        var RING_RADIUS = 46;
        var circumference = 2 * Math.PI * RING_RADIUS;
        progressCircle.style.strokeDasharray = circumference + ' ' + circumference;
        progressCircle.style.strokeDashoffset = circumference;

        // --- Load and validate tasks from localStorage ---
        var tasks = loadTasks();

        // Tracks whether a save is in progress to prevent double-submit
        var isSaving = false;

        // Active filter state
        var currentCategory = 'all';
        var currentDateFilter = 'all';
        var currentSearch = '';

        // Show the user's name in the sidebar
        sidebarUsername.textContent = userName;


        // =============================================
        //  GREETING & DATE
        // =============================================

        function setGreeting() {
            var now = new Date();
            var hour = now.getHours();
            var period = 'evening';
            if (hour < 12) period = 'morning';
            else if (hour < 18) period = 'afternoon';
            greetingEl.textContent = 'Good ' + period + ', ' + userName + '!';

            var dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
            var monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            currentDateEl.textContent = dayNames[now.getDay()] + ', ' + monthNames[now.getMonth()] + ' ' + now.getDate();
        }
        setGreeting();


        // =============================================
        //  DATA PERSISTENCE
        // =============================================

        /**
         * Loads tasks from localStorage and validates each entry.
         * If the stored data is corrupt or has missing fields, malformed entries
         * are silently dropped. This prevents the app from crashing if a user
         * manually edits localStorage or if the data schema changes between versions.
         */
        function loadTasks() {
            var raw;
            try {
                raw = JSON.parse(localStorage.getItem('taskflow_tasks'));
            } catch (e) {
                // Stored JSON was corrupt — start fresh
                return [];
            }
            if (!Array.isArray(raw)) return [];

            var valid = [];
            for (var i = 0; i < raw.length; i++) {
                var t = raw[i];
                // Each task must have an id, title, status, category, priority, and dueDate (all as strings)
                if (t && typeof t.id === 'string' && typeof t.title === 'string' && typeof t.status === 'string' &&
                    typeof t.category === 'string' && typeof t.priority === 'string' && typeof t.dueDate === 'string') {
                    valid.push(t);
                }
            }
            return valid;
        }

        /**
         * Persists the tasks array to localStorage.
         * Wrapped in try/catch because localStorage has a ~5MB quota.
         * If the quota is exceeded (e.g. hundreds of tasks with long descriptions),
         * we alert the user rather than silently losing data.
         */
        function saveTasks() {
            try {
                localStorage.setItem('taskflow_tasks', JSON.stringify(tasks));
            } catch (e) {
                alert('Could not save — your browser storage may be full. Try deleting some tasks.');
            }
        }


        // =============================================
        //  PROGRESS RING
        // =============================================

        function updateProgressRing(percent) {
            // Offset = how much of the circle to hide.
            // 0% done → offset = full circumference (nothing visible)
            // 100% done → offset = 0 (full circle visible)
            var offset = circumference - (percent / 100) * circumference;
            progressCircle.style.strokeDashoffset = offset;
        }


        // =============================================
        //  STATS
        // =============================================

        function updateStats() {
            var total = tasks.length;
            var doneCount = 0;
            var activeCount = 0;
            for (var i = 0; i < tasks.length; i++) {
                if (tasks[i].status === 'done') doneCount++;
                else activeCount++;
            }
            statTotalEl.textContent = total;
            statPendingEl.textContent = activeCount;

            var percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);
            completionPercentageEl.textContent = percent + '%';
            updateProgressRing(percent);
        }


        // =============================================
        //  DATE & FORMATTING HELPERS
        // =============================================

        /** Returns today's date at midnight, used for date comparisons. */
        function todayDate() {
            var d = new Date();
            d.setHours(0, 0, 0, 0);
            return d;
        }

        /** Checks if a task's due date has passed (and it isn't already done). */
        function isOverdue(task) {
            if (!task.dueDate || task.status === 'done') return false;
            // 'T00:00:00' suffix forces the date to be parsed in local timezone
            // rather than UTC. Without this, a date like "2026-07-04" would be
            // treated as midnight UTC, which can shift it to the previous day
            // in timezones west of UTC.
            return new Date(task.dueDate + 'T00:00:00') < todayDate();
        }

        /** Formats "2026-07-04" → "Jul 4" for display on task cards. */
        function formatDue(dateStr) {
            if (!dateStr) return '';
            var d = new Date(dateStr + 'T00:00:00');
            var monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            return monthNames[d.getMonth()] + ' ' + d.getDate();
        }

        /** Maps category keys to their emoji for display. */
        function getCategoryEmoji(cat) {
            var map = {
                study:      '📚',
                assignment: '📝',
                work:       '💼',
                personal:   '🏠',
                health:     '❤️',
                other:      '📌'
            };
            return map[cat] || '📋';
        }

        /**
         * Escapes HTML special characters in user-provided strings.
         * This is necessary because we build task card HTML via string
         * concatenation (innerHTML), so raw user input could inject
         * arbitrary HTML/script tags if not escaped.
         */
        function escapeHtml(str) {
            if (typeof str !== 'string') return '';
            return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        }


        // =============================================
        //  FILTER LOGIC
        // =============================================

        function passesCategory(task) {
            return currentCategory === 'all' || task.category === currentCategory;
        }

        function passesDateFilter(task) {
            if (currentDateFilter === 'all') return true;
            if (!task.dueDate) return false;

            var today = todayDate();
            var due = new Date(task.dueDate + 'T00:00:00');

            if (currentDateFilter === 'today') {
                return due.toDateString() === today.toDateString();
            }
            if (currentDateFilter === 'week') {
                var weekEnd = new Date(today);
                weekEnd.setDate(today.getDate() + 7);
                return due >= today && due <= weekEnd;
            }
            if (currentDateFilter === 'overdue') {
                return due < today && task.status !== 'done';
            }
            return true;
        }

        function passesSearch(task) {
            if (!currentSearch) return true;
            var query = currentSearch.toLowerCase();
            var inTitle = task.title.toLowerCase().indexOf(query) !== -1;
            var inDesc = task.description && task.description.toLowerCase().indexOf(query) !== -1;
            return inTitle || inDesc;
        }


        // =============================================
        //  TASK CARD RENDERING
        // =============================================

        /**
         * Builds a single task card DOM element.
         * Uses innerHTML with string concatenation rather than individual
         * createElement calls — simpler to read for a small project, and
         * acceptable perf-wise since we're dealing with dozens of tasks, not thousands.
         */
        function makeTaskCard(task) {
            var card = document.createElement('div');
            card.className = 'task-card' + (task.status === 'done' ? ' completed' : '');

            // Each status gets a different action button:
            // todo → "Start" (move to in-progress)
            // in-progress → "Done" (move to done)
            // done → "Reopen" (move back to todo)
            var moveBtn = '';
            if (task.status === 'todo') {
                moveBtn = '<button class="task-act-btn" data-action="move" data-id="' + task.id + '" data-to="in-progress" title="Start">▶</button>';
            } else if (task.status === 'in-progress') {
                moveBtn = '<button class="task-act-btn" data-action="move" data-id="' + task.id + '" data-to="done" title="Done">✔</button>';
            } else {
                moveBtn = '<button class="task-act-btn" data-action="move" data-id="' + task.id + '" data-to="todo" title="Reopen">↩</button>';
            }

            // Due date display with overdue warning
            var duePart = '';
            if (task.dueDate) {
                var overdueClass = isOverdue(task) ? ' overdue' : '';
                var overdueIcon = isOverdue(task) ? ' ⚠' : '';
                duePart = '<span class="task-due' + overdueClass + '">📅 ' + formatDue(task.dueDate) + overdueIcon + '</span>';
            }

            card.innerHTML = [
                '<div class="task-card-header">',
                '  <span class="task-card-title">' + escapeHtml(task.title) + '</span>',
                '  <span class="priority-badge priority-' + task.priority + '">' + escapeHtml(task.priority) + '</span>',
                '</div>',
                task.description ? '<p class="task-desc-text">' + escapeHtml(task.description) + '</p>' : '',
                '<div class="task-meta">',
                '  <div class="task-meta-left">',
                '    <span>' + getCategoryEmoji(task.category) + ' ' + escapeHtml(task.category || '') + '</span>',
                duePart,
                '  </div>',
                '  <div class="task-actions">',
                moveBtn,
                '    <button class="task-act-btn" data-action="edit" data-id="' + task.id + '" title="Edit">✏️</button>',
                '    <button class="task-act-btn" data-action="delete" data-id="' + task.id + '" title="Delete">🗑️</button>',
                '  </div>',
                '</div>'
            ].join('');

            return card;
        }


        // =============================================
        //  BOARD RENDERING
        //  Uses a "clear and rebuild" approach: every time the task array
        //  changes, we wipe all three column containers and re-render
        //  every visible task from scratch. This is simpler than tracking
        //  individual DOM changes, and fast enough for the expected scale
        //  (tens of tasks, not thousands).
        // =============================================

        function renderBoard() {
            listTodo.innerHTML = '';
            listInProgress.innerHTML = '';
            listDone.innerHTML = '';

            var todoCount = 0;
            var progressCount = 0;
            var doneCount = 0;

            for (var i = 0; i < tasks.length; i++) {
                var t = tasks[i];
                if (!passesCategory(t) || !passesSearch(t) || !passesDateFilter(t)) continue;

                var card = makeTaskCard(t);
                if (t.status === 'todo') { listTodo.appendChild(card); todoCount++; }
                else if (t.status === 'in-progress') { listInProgress.appendChild(card); progressCount++; }
                else if (t.status === 'done') { listDone.appendChild(card); doneCount++; }
            }

            // Show contextual empty state messages
            if (todoCount === 0) {
                var msg = tasks.length === 0 ? 'No tasks yet — click + Add Task!' : 'Nothing here';
                appendEmpty(listTodo, msg);
            }
            if (progressCount === 0) appendEmpty(listInProgress, 'Nothing in progress');
            if (doneCount === 0) appendEmpty(listDone, 'Completed tasks show up here');

            countTodoEl.textContent = todoCount;
            countProgressEl.textContent = progressCount;
            countDoneEl.textContent = doneCount;
            updateStats();
        }

        function appendEmpty(container, msg) {
            var el = document.createElement('div');
            el.className = 'empty-state';
            el.textContent = msg;
            container.appendChild(el);
        }


        // =============================================
        //  TASK ACTIONS (via event delegation)
        //  Instead of attaching onclick to every button inside each task card,
        //  we use a single listener on the document. When a click happens, we
        //  check if it landed on a .task-act-btn and read its data-* attributes
        //  to determine what to do. This is more efficient than N individual
        //  listeners, and avoids re-attaching them on every re-render.
        // =============================================

        document.addEventListener('click', function(e) {
            var btn = e.target.closest('.task-act-btn');
            if (!btn) return;

            var action = btn.getAttribute('data-action');
            var id = btn.getAttribute('data-id');

            if (action === 'move') {
                var newStatus = btn.getAttribute('data-to');
                for (var i = 0; i < tasks.length; i++) {
                    if (tasks[i].id === id) {
                        tasks[i].status = newStatus;
                        break;
                    }
                }
                saveTasks();
                renderBoard();
            }
            else if (action === 'edit') {
                var task = null;
                for (var i = 0; i < tasks.length; i++) {
                    if (tasks[i].id === id) { task = tasks[i]; break; }
                }
                if (!task) return;

                modalTitle.textContent = 'Edit Task';
                taskIdInput.value = task.id;
                taskTitleInput.value = task.title;
                taskCategorySelect.value = task.category;
                taskPrioritySelect.value = task.priority;
                taskDueDateInput.value = task.dueDate || '';
                taskDescInput.value = task.description || '';
                openModal();
            }
            else if (action === 'delete') {
                if (!confirm('Delete this task?')) return;
                var remaining = [];
                for (var i = 0; i < tasks.length; i++) {
                    if (tasks[i].id !== id) remaining.push(tasks[i]);
                }
                tasks = remaining;
                saveTasks();
                renderBoard();
            }
        });


        // =============================================
        //  MODAL (add / edit task form)
        // =============================================

        function openModal() {
            taskModal.classList.remove('hidden');
            setTimeout(function() { taskTitleInput.focus(); }, 50);
        }

        function closeModal() {
            // Guard: only act if the modal is actually visible
            if (taskModal.classList.contains('hidden')) return;

            taskModal.classList.add('hidden');
            taskForm.reset();
            taskIdInput.value = '';
            modalTitle.textContent = 'Add Task';
            isSaving = false;
        }

        addTaskBtn.addEventListener('click', function() {
            // Default the due date to today for convenience
            taskDueDateInput.value = new Date().toISOString().split('T')[0];
            openModal();
        });

        closeModalBtn.addEventListener('click', closeModal);
        cancelTaskBtn.addEventListener('click', closeModal);
        modalBackdrop.addEventListener('click', closeModal);

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closeModal();
        });


        // =============================================
        //  FORM SUBMISSION
        // =============================================

        taskForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Prevent double-submit (e.g. rapid double-click on Save)
            if (isSaving) return;
            isSaving = true;

            var id = taskIdInput.value;
            var title = taskTitleInput.value.trim();
            if (!title) {
                isSaving = false;
                return;
            }

            if (id) {
                // Editing an existing task — find it by ID and update fields
                for (var i = 0; i < tasks.length; i++) {
                    if (tasks[i].id === id) {
                        tasks[i].title = title;
                        tasks[i].category = taskCategorySelect.value;
                        tasks[i].priority = taskPrioritySelect.value;
                        tasks[i].dueDate = taskDueDateInput.value;
                        tasks[i].description = taskDescInput.value.trim();
                        break;
                    }
                }
            } else {
                // Creating a new task.
                // ID is Date.now() as a string — millisecond precision is sufficient
                // for a single-user localStorage app. In a multi-user or server-backed
                // system you'd use UUIDs or server-generated IDs instead.
                tasks.push({
                    id: Date.now().toString(),
                    title: title,
                    category: taskCategorySelect.value,
                    priority: taskPrioritySelect.value,
                    dueDate: taskDueDateInput.value,
                    description: taskDescInput.value.trim(),
                    status: 'todo'
                });
            }

            saveTasks();
            renderBoard();
            closeModal();
        });


        // =============================================
        //  FILTER EVENT HANDLERS
        // =============================================

        searchInput.addEventListener('input', function() {
            currentSearch = this.value.trim();
            renderBoard();
        });

        // Category filter buttons in the sidebar
        filterButtons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                filterButtons.forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                currentCategory = btn.getAttribute('data-filter');
                renderBoard();
            });
        });

        // Date filter dropdown in the header
        dateFilterSelect.addEventListener('change', function() {
            currentDateFilter = this.value;
            renderBoard();
        });


        // =============================================
        //  USER CONTROLS (change name / clear data)
        // =============================================

        changeNameBtn.addEventListener('click', function() {
            var newName = prompt('Enter your new name:');
            if (newName && newName.trim()) {
                newName = newName.trim();
                localStorage.setItem('taskflow_username', newName);
                userName = newName;
                sidebarUsername.textContent = newName;
                setGreeting();
            }
        });

        clearDataBtn.addEventListener('click', function() {
            if (confirm('This will delete ALL your tasks and reset your name. Are you sure?')) {
                localStorage.removeItem('taskflow_tasks');
                localStorage.removeItem('taskflow_username');
                location.reload();
            }
        });

        // --- Initial render ---
        renderBoard();
    }
});
