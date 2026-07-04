// TaskFlow - app.js
// Web Tech Project, July 2026
// Built by Saatvik Gupta

document.addEventListener('DOMContentLoaded', function() {

    // =============================================
    //  WELCOME SCREEN
    // =============================================
    var welcomeScreen = document.getElementById('welcome-screen');
    var appContainer = document.getElementById('app-container');
    var welcomeNameInput = document.getElementById('welcome-name');
    var welcomeGoBtn = document.getElementById('welcome-go-btn');

    var savedName = localStorage.getItem('taskflow_username');

    if (savedName) {
        welcomeScreen.style.display = 'none';
        appContainer.style.display = 'block';
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
        var name = welcomeNameInput.value.trim();
        if (!name) {
            welcomeNameInput.style.borderColor = '#f06f7e';
            welcomeNameInput.focus();
            return;
        }
        localStorage.setItem('taskflow_username', name);
        welcomeScreen.classList.add('hide');

        setTimeout(function() {
            welcomeScreen.style.display = 'none';
            appContainer.style.display = 'block';
            initApp(name);
        }, 300);
    }

    // =============================================
    //  MAIN APP
    // =============================================
    function initApp(userName) {

        // DOM references
        var greetingEl = document.getElementById('greeting');
        var currentDateEl = document.getElementById('current-date');
        var topbarUser = document.getElementById('topbar-user');
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

        var taskListContainer = document.getElementById('task-list');
        var searchInput = document.getElementById('search-input');
        var dateFilterSelect = document.getElementById('date-filter');

        // stat elements
        var statTotal = document.getElementById('stat-total');
        var statActive = document.getElementById('stat-active');
        var statDonePct = document.getElementById('stat-done-pct');
        var statOverdue = document.getElementById('stat-overdue');

        // tab count elements
        var tabCountAll = document.getElementById('tab-count-all');
        var tabCountTodo = document.getElementById('tab-count-todo');
        var tabCountProgress = document.getElementById('tab-count-progress');
        var tabCountDone = document.getElementById('tab-count-done');

        // chip buttons and tab buttons
        var chipBtns = document.querySelectorAll('.chip');
        var tabBtns = document.querySelectorAll('.tab');

        // load data
        var tasks = JSON.parse(localStorage.getItem('taskflow_tasks')) || [];

        // filter state
        var currentCategory = 'all';
        var currentTab = 'all';
        var currentDateFilter = 'all';
        var currentSearch = '';

        // set user name in UI
        topbarUser.textContent = userName;

        // ---- Greeting ----
        function setGreeting() {
            var now = new Date();
            var h = now.getHours();
            var time = 'evening';
            if (h < 12) time = 'morning';
            else if (h < 18) time = 'afternoon';
            greetingEl.textContent = 'Good ' + time + ', ' + userName + '!';

            var dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
            var monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            currentDateEl.textContent = dayNames[now.getDay()] + ', ' + monthNames[now.getMonth()] + ' ' + now.getDate();
        }
        setGreeting();

        // ---- Storage ----
        function saveTasks() {
            localStorage.setItem('taskflow_tasks', JSON.stringify(tasks));
        }

        // ---- Helpers ----
        function todayDate() {
            var d = new Date();
            d.setHours(0, 0, 0, 0);
            return d;
        }

        function isOverdue(task) {
            if (!task.dueDate || task.status === 'done') return false;
            var due = new Date(task.dueDate + 'T00:00:00');
            return due < todayDate();
        }

        function formatDue(dateStr) {
            if (!dateStr) return '';
            var d = new Date(dateStr + 'T00:00:00');
            var m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            return m[d.getMonth()] + ' ' + d.getDate();
        }

        function getCategoryEmoji(cat) {
            var map = {
                study: '\u{1F4DA}',
                assignment: '\u{1F4DD}',
                work: '\u{1F4BC}',
                personal: '\u{1F3E0}',
                health: '\u2764\uFE0F',
                other: '\u{1F4CC}'
            };
            return map[cat] || '\u{1F4CB}';
        }

        function escapeHtml(str) {
            return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        }

        // ---- Filters ----
        function passesCategory(task) {
            if (currentCategory === 'all') return true;
            return task.category === currentCategory;
        }

        function passesTab(task) {
            if (currentTab === 'all') return true;
            return task.status === currentTab;
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
            var q = currentSearch.toLowerCase();
            var inTitle = task.title.toLowerCase().indexOf(q) !== -1;
            var inDesc = task.description && task.description.toLowerCase().indexOf(q) !== -1;
            return inTitle || inDesc;
        }

        // ---- Stats ----
        function updateStats() {
            var total = tasks.length;
            var doneCount = 0;
            var activeCount = 0;
            var overdueCount = 0;

            // also count per-status for tab badges
            var countTodo = 0;
            var countProgress = 0;
            var countDone = 0;

            for (var i = 0; i < tasks.length; i++) {
                var t = tasks[i];
                if (t.status === 'done') {
                    doneCount++;
                    countDone++;
                } else {
                    activeCount++;
                    if (t.status === 'todo') countTodo++;
                    if (t.status === 'in-progress') countProgress++;
                    if (isOverdue(t)) overdueCount++;
                }
            }

            statTotal.textContent = total;
            statActive.textContent = activeCount;
            statOverdue.textContent = overdueCount;
            var pct = total === 0 ? 0 : Math.round((doneCount / total) * 100);
            statDonePct.textContent = pct + '%';

            // tab counts
            tabCountAll.textContent = total;
            tabCountTodo.textContent = countTodo;
            tabCountProgress.textContent = countProgress;
            tabCountDone.textContent = countDone;
        }

        // ---- Build a task card ----
        function makeTaskCard(task) {
            var card = document.createElement('div');
            card.className = 'task-card' + (task.status === 'done' ? ' completed' : '');

            // status bar class
            var barClass = 'bar-todo';
            if (task.status === 'in-progress') barClass = 'bar-progress';
            if (task.status === 'done') barClass = 'bar-done';

            // action button based on status
            var moveBtn = '';
            if (task.status === 'todo') {
                moveBtn = '<button class="act-btn" data-action="move" data-id="' + task.id + '" data-to="in-progress" title="Start">\u25B6</button>';
            } else if (task.status === 'in-progress') {
                moveBtn = '<button class="act-btn" data-action="move" data-id="' + task.id + '" data-to="done" title="Mark done">\u2714</button>';
            } else {
                moveBtn = '<button class="act-btn" data-action="move" data-id="' + task.id + '" data-to="todo" title="Reopen">\u21A9</button>';
            }

            // due date
            var duePart = '';
            if (task.dueDate) {
                var oClass = isOverdue(task) ? ' overdue' : '';
                var oLabel = isOverdue(task) ? ' \u26A0' : '';
                duePart = '<span class="task-due' + oClass + '">\u{1F4C5} ' + formatDue(task.dueDate) + oLabel + '</span>';
            }

            // description preview (first 60 chars)
            var descPreview = '';
            if (task.description) {
                var preview = task.description.length > 60 ? task.description.substring(0, 60) + '...' : task.description;
                descPreview = '<div class="task-desc-preview">' + escapeHtml(preview) + '</div>';
            }

            card.innerHTML = [
                '<div class="task-status-bar ' + barClass + '"></div>',
                '<div class="task-info">',
                '  <div class="task-title">' + escapeHtml(task.title) + '</div>',
                '  <div class="task-meta-row">',
                '    <span class="badge badge-' + task.priority + '">' + task.priority + '</span>',
                '    <span>' + getCategoryEmoji(task.category) + ' ' + task.category + '</span>',
                duePart,
                '  </div>',
                descPreview,
                '</div>',
                '<div class="task-actions">',
                moveBtn,
                '  <button class="act-btn" data-action="edit" data-id="' + task.id + '" title="Edit">\u270F\uFE0F</button>',
                '  <button class="act-btn" data-action="delete" data-id="' + task.id + '" title="Delete">\u{1F5D1}\uFE0F</button>',
                '</div>'
            ].join('');

            return card;
        }

        // ---- Render ----
        function renderList() {
            taskListContainer.innerHTML = '';

            var count = 0;
            for (var i = 0; i < tasks.length; i++) {
                var t = tasks[i];
                if (!passesCategory(t)) continue;
                if (!passesTab(t)) continue;
                if (!passesDateFilter(t)) continue;
                if (!passesSearch(t)) continue;

                taskListContainer.appendChild(makeTaskCard(t));
                count++;
            }

            // empty state
            if (count === 0) {
                var empty = document.createElement('div');
                empty.className = 'empty-state';
                if (tasks.length === 0) {
                    empty.innerHTML = '<span class="empty-icon">\u{1F680}</span>No tasks yet! Click <strong>+ New Task</strong> to add your first one.';
                } else {
                    empty.innerHTML = '<span class="empty-icon">\u{1F50D}</span>No tasks match your current filters.';
                }
                taskListContainer.appendChild(empty);
            }

            updateStats();
        }

        // ---- Event delegation for task actions ----
        document.addEventListener('click', function(e) {
            var btn = e.target.closest('.act-btn');
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
                renderList();
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
                var remaining = [];
                for (var i = 0; i < tasks.length; i++) {
                    if (tasks[i].id !== id) remaining.push(tasks[i]);
                }
                tasks = remaining;
                saveTasks();
                renderList();
            }
        });

        // ---- Modal ----
        function openModal() {
            taskModal.classList.remove('hidden');
            setTimeout(function() { taskTitleInput.focus(); }, 50);
        }

        function closeModal() {
            taskModal.classList.add('hidden');
            taskForm.reset();
            taskIdInput.value = '';
            modalTitle.textContent = 'Add Task';
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

        // ---- Form submit ----
        taskForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var id = taskIdInput.value;
            var title = taskTitleInput.value.trim();
            if (!title) return;

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
            renderList();
            closeModal();
        });

        // ---- Search ----
        searchInput.addEventListener('input', function() {
            currentSearch = this.value.trim();
            renderList();
        });

        // ---- Category chips ----
        chipBtns.forEach(function(chip) {
            chip.addEventListener('click', function() {
                chipBtns.forEach(function(c) { c.classList.remove('active'); });
                chip.classList.add('active');
                currentCategory = chip.getAttribute('data-filter');
                renderList();
            });
        });

        // ---- Status tabs ----
        tabBtns.forEach(function(tab) {
            tab.addEventListener('click', function() {
                tabBtns.forEach(function(t) { t.classList.remove('active'); });
                tab.classList.add('active');
                currentTab = tab.getAttribute('data-tab');
                renderList();
            });
        });

        // ---- Date filter ----
        dateFilterSelect.addEventListener('change', function() {
            currentDateFilter = this.value;
            renderList();
        });

        // ---- User controls ----
        changeNameBtn.addEventListener('click', function() {
            var newName = prompt('Enter your new name:');
            if (newName && newName.trim()) {
                newName = newName.trim();
                localStorage.setItem('taskflow_username', newName);
                userName = newName;
                topbarUser.textContent = newName;
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

        // ---- Initial render ----
        renderList();
    }
});
