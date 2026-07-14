// TaskFlow - app.js
// Handles name prompt on first launch and local storage CRUD operations.

document.addEventListener('DOMContentLoaded', function() {
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
        welcomeNameInput.style.borderColor = '';

        var name = welcomeNameInput.value.trim();
        if (!name) {
            welcomeNameInput.style.borderColor = '#f06b7e';
            welcomeNameInput.focus();
            return;
        }
        localStorage.setItem('taskflow_username', name);
        welcomeScreen.classList.add('hide');

        // Delay view transition to allow the fade out animation to finish
        setTimeout(function() {
            welcomeScreen.style.display = 'none';
            appContainer.classList.remove('hidden');
            appContainer.style.display = 'flex';
            initApp(name);
        }, 300);
    }

    function initApp(userName) {
        // DOM bindings
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

        var taskIdInput = document.getElementById('task-id');
        var taskTitleInput = document.getElementById('task-title-input');
        var taskCategorySelect = document.getElementById('task-category');
        var taskPrioritySelect = document.getElementById('task-priority');
        var taskDueDateInput = document.getElementById('task-due-date');
        var taskDescInput = document.getElementById('task-desc');

        var listTodo = document.getElementById('list-todo');
        var listInProgress = document.getElementById('list-in-progress');
        var listDone = document.getElementById('list-done');

        var countTodoEl = document.getElementById('count-todo');
        var countProgressEl = document.getElementById('count-progress');
        var countDoneEl = document.getElementById('count-done');

        var statTotalEl = document.getElementById('stat-total');
        var statPendingEl = document.getElementById('stat-pending');
        var completionPercentageEl = document.getElementById('completion-percentage');
        var progressCircle = document.querySelector('.progress-ring__circle');

        var searchInput = document.getElementById('search-input');
        var filterButtons = document.querySelectorAll('.filter-btn');
        var dateFilterSelect = document.getElementById('date-filter');

        // Circular progress bar math
        var RING_RADIUS = 46;
        var circumference = 2 * Math.PI * RING_RADIUS;
        progressCircle.style.strokeDasharray = circumference + ' ' + circumference;
        progressCircle.style.strokeDashoffset = circumference;

        var tasks = loadTasks();
        var isSaving = false;

        // Current filter values
        var currentCategory = 'all';
        var currentDateFilter = 'all';
        var currentSearch = '';

        sidebarUsername.textContent = userName;

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

        // Load tasks and filter corrupt or non-standard structures
        function loadTasks() {
            var raw;
            try {
                raw = JSON.parse(localStorage.getItem('taskflow_tasks'));
            } catch (e) {
                return [];
            }
            if (!Array.isArray(raw)) return [];

            var valid = [];
            for (var i = 0; i < raw.length; i++) {
                var t = raw[i];
                if (t && typeof t.id === 'string' && typeof t.title === 'string' && typeof t.status === 'string' &&
                    typeof t.category === 'string' && typeof t.priority === 'string' && typeof t.dueDate === 'string') {
                    valid.push(t);
                }
            }
            return valid;
        }

        // Save active array to browser storage
        function saveTasks() {
            try {
                localStorage.setItem('taskflow_tasks', JSON.stringify(tasks));
            } catch (e) {
                alert('Could not save — your browser storage may be full. Try deleting some tasks.');
            }
        }

        function updateProgressRing(percent) {
            var offset = circumference - (percent / 100) * circumference;
            progressCircle.style.strokeDashoffset = offset;
        }

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

        function todayDate() {
            var d = new Date();
            d.setHours(0, 0, 0, 0);
            return d;
        }

        function isOverdue(task) {
            if (!task.dueDate || task.status === 'done') return false;
            // append local timezone suffix to avoid UTC date shifting
            return new Date(task.dueDate + 'T00:00:00') < todayDate();
        }

        function formatDue(dateStr) {
            if (!dateStr) return '';
            var d = new Date(dateStr + 'T00:00:00');
            var monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            return monthNames[d.getMonth()] + ' ' + d.getDate();
        }

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

        function escapeHtml(str) {
            if (typeof str !== 'string') return '';
            return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        }

        function sanitizePriority(p) {
            var valid = ['low', 'medium', 'high'];
            return valid.indexOf(p) !== -1 ? p : 'medium';
        }

        // Filtering
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

        // Create Task Card DOM element using template strings
        function makeTaskCard(task) {
            var card = document.createElement('div');
            card.className = 'task-card' + (task.status === 'done' ? ' completed' : '');

            var moveBtn = '';
            if (task.status === 'todo') {
                moveBtn = `<button class="task-act-btn" data-action="move" data-id="${task.id}" data-to="in-progress" title="Start" aria-label="Start">▶</button>`;
            } else if (task.status === 'in-progress') {
                moveBtn = `<button class="task-act-btn" data-action="move" data-id="${task.id}" data-to="done" title="Done" aria-label="Done">✔</button>`;
            } else {
                moveBtn = `<button class="task-act-btn" data-action="move" data-id="${task.id}" data-to="todo" title="Reopen" aria-label="Reopen">↩</button>`;
            }

            var duePart = '';
            if (task.dueDate) {
                var overdueClass = isOverdue(task) ? ' overdue' : '';
                var overdueIcon = isOverdue(task) ? ' ⚠' : '';
                duePart = `<span class="task-due${overdueClass}">📅 ${formatDue(task.dueDate)}${overdueIcon}</span>`;
            }

            var safeTitle = escapeHtml(task.title);
            var safePriority = sanitizePriority(task.priority);
            var safeDesc = task.description ? `<p class="task-desc-text">${escapeHtml(task.description)}</p>` : '';
            var categoryText = `${getCategoryEmoji(task.category)} ${escapeHtml(task.category || '')}`;

            card.innerHTML = `
                <div class="task-card-header">
                    <span class="task-card-title">${safeTitle}</span>
                    <span class="priority-badge priority-${safePriority}">${safePriority}</span>
                </div>
                ${safeDesc}
                <div class="task-meta">
                    <div class="task-meta-left">
                        <span>${categoryText}</span>
                        ${duePart}
                    </div>
                    <div class="task-actions">
                        ${moveBtn}
                        <button class="task-act-btn" data-action="edit" data-id="${task.id}" title="Edit" aria-label="Edit task">✏️</button>
                        <button class="task-act-btn" data-action="delete" data-id="${task.id}" title="Delete" aria-label="Delete task">🗑️</button>
                    </div>
                </div>
            `;

            return card;
        }

        // Full board rebuild cycle
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

        // Action delegate handler
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

        function openModal() {
            taskModal.classList.remove('hidden');
            setTimeout(function() { taskTitleInput.focus(); }, 50);
        }

        function closeModal() {
            if (taskModal.classList.contains('hidden')) return;

            taskModal.classList.add('hidden');
            taskForm.reset();
            taskIdInput.value = '';
            modalTitle.textContent = 'Add Task';
            isSaving = false;
        }

        addTaskBtn.addEventListener('click', function() {
            taskDueDateInput.value = new Date().toISOString().split('T')[0];
            openModal();
        });

        closeModalBtn.addEventListener('click', closeModal);
        cancelTaskBtn.addEventListener('click', closeModal);
        modalBackdrop.addEventListener('click', closeModal);

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closeModal();
        });

        taskForm.addEventListener('submit', function(e) {
            e.preventDefault();

            if (isSaving) return;
            isSaving = true;

            var id = taskIdInput.value;
            var title = taskTitleInput.value.trim();
            if (!title) {
                isSaving = false;
                return;
            }

            if (id) {
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

        searchInput.addEventListener('input', function() {
            currentSearch = this.value.trim();
            renderBoard();
        });

        filterButtons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                filterButtons.forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                currentCategory = btn.getAttribute('data-filter');
                renderBoard();
            });
        });

        dateFilterSelect.addEventListener('change', function() {
            currentDateFilter = this.value;
            renderBoard();
        });

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

        renderBoard();
    }
});
