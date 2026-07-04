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
        var name = welcomeNameInput.value.trim();
        if (!name) {
            welcomeNameInput.style.borderColor = '#f06b7e';
            welcomeNameInput.focus();
            return;
        }
        localStorage.setItem('taskflow_username', name);
        welcomeScreen.classList.add('hide');
        setTimeout(function() {
            welcomeScreen.style.display = 'none';
            appContainer.style.display = 'flex';
            initApp(name);
        }, 300);
    }

    // =============================================
    //  MAIN APP
    // =============================================
    function initApp(userName) {

        // DOM refs
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

        // form fields
        var taskIdInput = document.getElementById('task-id');
        var taskTitleInput = document.getElementById('task-title-input');
        var taskCategorySelect = document.getElementById('task-category');
        var taskPrioritySelect = document.getElementById('task-priority');
        var taskDueDateInput = document.getElementById('task-due-date');
        var taskDescInput = document.getElementById('task-desc');

        // board columns
        var listTodo = document.getElementById('list-todo');
        var listInProgress = document.getElementById('list-in-progress');
        var listDone = document.getElementById('list-done');

        // count badges
        var countTodoEl = document.getElementById('count-todo');
        var countProgressEl = document.getElementById('count-progress');
        var countDoneEl = document.getElementById('count-done');

        // stats
        var statTotalEl = document.getElementById('stat-total');
        var statPendingEl = document.getElementById('stat-pending');
        var completionPercentageEl = document.getElementById('completion-percentage');
        var progressCircle = document.querySelector('.progress-ring__circle');

        // filters
        var searchInput = document.getElementById('search-input');
        var filterButtons = document.querySelectorAll('.filter-btn');
        var dateFilterSelect = document.getElementById('date-filter');

        // progress circle math
        var radius = 46;
        var circumference = 2 * Math.PI * radius;
        progressCircle.style.strokeDasharray = circumference + ' ' + circumference;
        progressCircle.style.strokeDashoffset = circumference;

        // load tasks
        var tasks = JSON.parse(localStorage.getItem('taskflow_tasks')) || [];

        // filter state
        var currentCategory = 'all';
        var currentDateFilter = 'all';
        var currentSearch = '';

        // set user name
        sidebarUsername.textContent = userName;

        // greeting
        function setGreeting() {
            var now = new Date();
            var h = now.getHours();
            var time = 'evening';
            if (h < 12) time = 'morning';
            else if (h < 18) time = 'afternoon';
            greetingEl.textContent = 'Good ' + time + ', ' + userName + '!';

            var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
            var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            currentDateEl.textContent = days[now.getDay()] + ', ' + months[now.getMonth()] + ' ' + now.getDate();
        }
        setGreeting();

        // storage
        function saveTasks() {
            localStorage.setItem('taskflow_tasks', JSON.stringify(tasks));
        }

        // progress ring
        function updateProgressRing(percent) {
            var offset = circumference - (percent / 100) * circumference;
            progressCircle.style.strokeDashoffset = offset;
        }

        // stats
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
            var pct = total === 0 ? 0 : Math.round((doneCount / total) * 100);
            completionPercentageEl.textContent = pct + '%';
            updateProgressRing(pct);
        }

        // helpers
        function todayDate() {
            var d = new Date();
            d.setHours(0, 0, 0, 0);
            return d;
        }

        function isOverdue(task) {
            if (!task.dueDate || task.status === 'done') return false;
            return new Date(task.dueDate + 'T00:00:00') < todayDate();
        }

        function formatDue(dateStr) {
            if (!dateStr) return '';
            var d = new Date(dateStr + 'T00:00:00');
            var m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            return m[d.getMonth()] + ' ' + d.getDate();
        }

        function getCategoryEmoji(cat) {
            var map = { study: '\u{1F4DA}', assignment: '\u{1F4DD}', work: '\u{1F4BC}', personal: '\u{1F3E0}', health: '\u2764\uFE0F', other: '\u{1F4CC}' };
            return map[cat] || '\u{1F4CB}';
        }

        function escapeHtml(str) {
            return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }

        // filters
        function passesCategory(task) {
            return currentCategory === 'all' || task.category === currentCategory;
        }

        function passesDateFilter(task) {
            if (currentDateFilter === 'all') return true;
            if (!task.dueDate) return false;
            var today = todayDate();
            var due = new Date(task.dueDate + 'T00:00:00');
            if (currentDateFilter === 'today') return due.toDateString() === today.toDateString();
            if (currentDateFilter === 'week') {
                var end = new Date(today);
                end.setDate(today.getDate() + 7);
                return due >= today && due <= end;
            }
            if (currentDateFilter === 'overdue') return due < today && task.status !== 'done';
            return true;
        }

        function passesSearch(task) {
            if (!currentSearch) return true;
            var q = currentSearch.toLowerCase();
            return task.title.toLowerCase().indexOf(q) !== -1 ||
                   (task.description && task.description.toLowerCase().indexOf(q) !== -1);
        }

        // build task card
        function makeTaskCard(task) {
            var card = document.createElement('div');
            card.className = 'task-card' + (task.status === 'done' ? ' completed' : '');

            var moveBtn = '';
            if (task.status === 'todo') {
                moveBtn = '<button class="task-act-btn" data-action="move" data-id="' + task.id + '" data-to="in-progress" title="Start">\u25B6</button>';
            } else if (task.status === 'in-progress') {
                moveBtn = '<button class="task-act-btn" data-action="move" data-id="' + task.id + '" data-to="done" title="Done">\u2714</button>';
            } else {
                moveBtn = '<button class="task-act-btn" data-action="move" data-id="' + task.id + '" data-to="todo" title="Reopen">\u21A9</button>';
            }

            var duePart = '';
            if (task.dueDate) {
                var cls = isOverdue(task) ? ' overdue' : '';
                var warn = isOverdue(task) ? ' \u26A0' : '';
                duePart = '<span class="task-due' + cls + '">\u{1F4C5} ' + formatDue(task.dueDate) + warn + '</span>';
            }

            card.innerHTML = [
                '<div class="task-card-header">',
                '  <span class="task-card-title">' + escapeHtml(task.title) + '</span>',
                '  <span class="priority-badge priority-' + task.priority + '">' + task.priority + '</span>',
                '</div>',
                task.description ? '<p class="task-desc-text">' + escapeHtml(task.description) + '</p>' : '',
                '<div class="task-meta">',
                '  <div class="task-meta-left">',
                '    <span>' + getCategoryEmoji(task.category) + ' ' + task.category + '</span>',
                duePart,
                '  </div>',
                '  <div class="task-actions">',
                moveBtn,
                '    <button class="task-act-btn" data-action="edit" data-id="' + task.id + '" title="Edit">\u270F\uFE0F</button>',
                '    <button class="task-act-btn" data-action="delete" data-id="' + task.id + '" title="Delete">\u{1F5D1}\uFE0F</button>',
                '  </div>',
                '</div>'
            ].join('');

            return card;
        }

        // render board
        function renderBoard() {
            listTodo.innerHTML = '';
            listInProgress.innerHTML = '';
            listDone.innerHTML = '';

            var cntT = 0, cntP = 0, cntD = 0;

            for (var i = 0; i < tasks.length; i++) {
                var t = tasks[i];
                if (!passesCategory(t) || !passesSearch(t) || !passesDateFilter(t)) continue;

                var card = makeTaskCard(t);
                if (t.status === 'todo') { listTodo.appendChild(card); cntT++; }
                else if (t.status === 'in-progress') { listInProgress.appendChild(card); cntP++; }
                else if (t.status === 'done') { listDone.appendChild(card); cntD++; }
            }

            // empty states
            if (cntT === 0) appendEmpty(listTodo, tasks.length === 0 ? 'No tasks yet \u2014 click + Add Task!' : 'Nothing here');
            if (cntP === 0) appendEmpty(listInProgress, 'Nothing in progress');
            if (cntD === 0) appendEmpty(listDone, 'Completed tasks show up here');

            countTodoEl.textContent = cntT;
            countProgressEl.textContent = cntP;
            countDoneEl.textContent = cntD;
            updateStats();
        }

        function appendEmpty(container, msg) {
            var el = document.createElement('div');
            el.className = 'empty-state';
            el.textContent = msg;
            container.appendChild(el);
        }

        // event delegation for task actions
        document.addEventListener('click', function(e) {
            var btn = e.target.closest('.task-act-btn');
            if (!btn) return;
            var action = btn.getAttribute('data-action');
            var id = btn.getAttribute('data-id');

            if (action === 'move') {
                var to = btn.getAttribute('data-to');
                for (var i = 0; i < tasks.length; i++) {
                    if (tasks[i].id === id) { tasks[i].status = to; break; }
                }
                saveTasks(); renderBoard();
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
                saveTasks(); renderBoard();
            }
        });

        // modal
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
        document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeModal(); });

        // form submit
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
            saveTasks(); renderBoard(); closeModal();
        });

        // search
        searchInput.addEventListener('input', function() {
            currentSearch = this.value.trim();
            renderBoard();
        });

        // category filters
        filterButtons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                filterButtons.forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                currentCategory = btn.getAttribute('data-filter');
                renderBoard();
            });
        });

        // date filter
        dateFilterSelect.addEventListener('change', function() {
            currentDateFilter = this.value;
            renderBoard();
        });

        // user controls
        changeNameBtn.addEventListener('click', function() {
            var n = prompt('Enter your new name:');
            if (n && n.trim()) {
                n = n.trim();
                localStorage.setItem('taskflow_username', n);
                userName = n;
                sidebarUsername.textContent = n;
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

        // go
        renderBoard();
    }
});
