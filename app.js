// TaskFlow - app.js
// Web Tech Project, July 2026
// Built by Saatvik Gupta

document.addEventListener('DOMContentLoaded', function() {

    // =============================================
    //  WELCOME SCREEN - ask name on first visit
    // =============================================
    var welcomeScreen = document.getElementById('welcome-screen');
    var appContainer = document.getElementById('app-container');
    var welcomeNameInput = document.getElementById('welcome-name');
    var welcomeGoBtn = document.getElementById('welcome-go-btn');

    // check if user already set their name before
    var savedName = localStorage.getItem('taskflow_username');

    if (savedName) {
        // skip welcome, go straight to app
        welcomeScreen.style.display = 'none';
        appContainer.style.display = 'flex';
        initApp(savedName);
    } else {
        // show welcome screen
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
            welcomeNameInput.style.borderColor = '#fb7185';
            welcomeNameInput.focus();
            return;
        }
        // save name and switch to app
        localStorage.setItem('taskflow_username', name);
        welcomeScreen.classList.add('hide');

        // wait for fade out animation
        setTimeout(function() {
            welcomeScreen.style.display = 'none';
            appContainer.style.display = 'flex';
            initApp(name);
        }, 350);
    }


    // =============================================
    //  MAIN APP
    // =============================================
    function initApp(userName) {

        // grab DOM elements
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

        // set up SVG progress circle math
        var radius = 46;
        var circumference = 2 * Math.PI * radius;
        progressCircle.style.strokeDasharray = circumference + ' ' + circumference;
        progressCircle.style.strokeDashoffset = circumference;

        // load tasks from localStorage
        var tasks = JSON.parse(localStorage.getItem('taskflow_tasks')) || [];

        // current filter state
        var currentCategory = 'all';
        var currentDateFilter = 'all';
        var currentSearch = '';

        // set the user's name everywhere
        sidebarUsername.textContent = userName;

        // set greeting based on time of day
        function setGreeting() {
            var now = new Date();
            var h = now.getHours();
            var timeOfDay = 'evening';
            if (h < 12) timeOfDay = 'morning';
            else if (h < 18) timeOfDay = 'afternoon';
            greetingEl.textContent = 'Good ' + timeOfDay + ', ' + userName + '!';

            var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
            var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            currentDateEl.textContent = days[now.getDay()] + ', ' + months[now.getMonth()] + ' ' + now.getDate();
        }
        setGreeting();

        // save tasks to localStorage
        function saveTasks() {
            localStorage.setItem('taskflow_tasks', JSON.stringify(tasks));
        }

        // update progress ring animation
        function updateProgressRing(percent) {
            var offset = circumference - (percent / 100) * circumference;
            progressCircle.style.strokeDashoffset = offset;
        }

        // update sidebar stats
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

        // --- filter logic ---

        function passesDateFilter(task) {
            if (currentDateFilter === 'all') return true;
            if (!task.dueDate) return false;

            var today = new Date();
            today.setHours(0, 0, 0, 0);
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
            var titleMatch = task.title.toLowerCase().indexOf(q) !== -1;
            var descMatch = task.description && task.description.toLowerCase().indexOf(q) !== -1;
            return titleMatch || descMatch;
        }

        function passesCategory(task) {
            if (currentCategory === 'all') return true;
            return task.category === currentCategory;
        }

        // --- helper functions ---

        function formatDue(dateStr) {
            if (!dateStr) return '';
            var d = new Date(dateStr + 'T00:00:00');
            var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            return months[d.getMonth()] + ' ' + d.getDate();
        }

        function isOverdue(task) {
            if (!task.dueDate || task.status === 'done') return false;
            var today = new Date();
            today.setHours(0, 0, 0, 0);
            var due = new Date(task.dueDate + 'T00:00:00');
            return due < today;
        }

        function getCategoryEmoji(cat) {
            var map = {
                study: '📚',
                assignment: '📝',
                work: '💼',
                personal: '🏠',
                health: '❤️',
                other: '📌'
            };
            return map[cat] || '📋';
        }

        // simple html escape
        function escapeHtml(str) {
            return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        }

        // build a task card DOM element
        function makeTaskCard(task) {
            var card = document.createElement('div');
            card.className = 'task-card' + (task.status === 'done' ? ' completed' : '');
            card.setAttribute('data-id', task.id);

            // status change button
            var statusBtn = '';
            if (task.status === 'todo') {
                statusBtn = '<button class="task-act-btn" data-action="move" data-id="' + task.id + '" data-to="in-progress" title="Start">▶</button>';
            } else if (task.status === 'in-progress') {
                statusBtn = '<button class="task-act-btn" data-action="move" data-id="' + task.id + '" data-to="done" title="Mark done">✔</button>';
            } else {
                statusBtn = '<button class="task-act-btn" data-action="move" data-id="' + task.id + '" data-to="todo" title="Reopen">↩</button>';
            }

            var duePart = '';
            if (task.dueDate) {
                var overdueClass = isOverdue(task) ? ' overdue' : '';
                var overdueLabel = isOverdue(task) ? ' ⚠' : '';
                duePart = '<span class="task-due' + overdueClass + '">📅 ' + formatDue(task.dueDate) + overdueLabel + '</span>';
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
                statusBtn,
                '    <button class="task-act-btn" data-action="edit" data-id="' + task.id + '" title="Edit">✏️</button>',
                '    <button class="task-act-btn" data-action="delete" data-id="' + task.id + '" title="Delete">🗑️</button>',
                '  </div>',
                '</div>'
            ].join('');

            return card;
        }

        // render the board
        function renderBoard() {
            listTodo.innerHTML = '';
            listInProgress.innerHTML = '';
            listDone.innerHTML = '';

            var todoCnt = 0, progressCnt = 0, doneCnt = 0;

            for (var i = 0; i < tasks.length; i++) {
                var t = tasks[i];
                if (!passesCategory(t) || !passesSearch(t) || !passesDateFilter(t)) continue;

                var card = makeTaskCard(t);
                if (t.status === 'todo') {
                    listTodo.appendChild(card);
                    todoCnt++;
                } else if (t.status === 'in-progress') {
                    listInProgress.appendChild(card);
                    progressCnt++;
                } else if (t.status === 'done') {
                    listDone.appendChild(card);
                    doneCnt++;
                }
            }

            // show empty state messages
            if (todoCnt === 0) {
                var e1 = document.createElement('div');
                e1.className = 'empty-state';
                e1.textContent = tasks.length === 0
                    ? 'No tasks yet — add your first one above!'
                    : 'Nothing matches your filters';
                listTodo.appendChild(e1);
            }
            if (progressCnt === 0) {
                var e2 = document.createElement('div');
                e2.className = 'empty-state';
                e2.textContent = 'Nothing in progress';
                listInProgress.appendChild(e2);
            }
            if (doneCnt === 0) {
                var e3 = document.createElement('div');
                e3.className = 'empty-state';
                e3.textContent = 'Completed tasks show up here';
                listDone.appendChild(e3);
            }

            countTodoEl.textContent = todoCnt;
            countProgressEl.textContent = progressCnt;
            countDoneEl.textContent = doneCnt;

            updateStats();
        }

        // --- task actions (using event delegation instead of inline onclick) ---

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
                var filtered = [];
                for (var i = 0; i < tasks.length; i++) {
                    if (tasks[i].id !== id) filtered.push(tasks[i]);
                }
                tasks = filtered;
                saveTasks();
                renderBoard();
            }
        });

        // --- modal ---

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
            var today = new Date().toISOString().split('T')[0];
            taskDueDateInput.value = today;
            openModal();
        });

        closeModalBtn.addEventListener('click', closeModal);
        cancelTaskBtn.addEventListener('click', closeModal);
        modalBackdrop.addEventListener('click', closeModal);

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closeModal();
        });

        // --- form submit ---

        taskForm.addEventListener('submit', function(e) {
            e.preventDefault();

            var id = taskIdInput.value;
            var title = taskTitleInput.value.trim();
            if (!title) return;

            if (id) {
                // editing existing
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
                // creating new
                var newTask = {
                    id: Date.now().toString(),
                    title: title,
                    category: taskCategorySelect.value,
                    priority: taskPrioritySelect.value,
                    dueDate: taskDueDateInput.value,
                    description: taskDescInput.value.trim(),
                    status: 'todo'
                };
                tasks.push(newTask);
            }

            saveTasks();
            renderBoard();
            closeModal();
        });

        // --- search ---

        searchInput.addEventListener('input', function() {
            currentSearch = this.value.trim();
            renderBoard();
        });

        // --- category filter ---

        filterButtons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                filterButtons.forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                currentCategory = btn.getAttribute('data-filter');
                renderBoard();
            });
        });

        // --- date filter ---

        dateFilterSelect.addEventListener('change', function() {
            currentDateFilter = this.value;
            renderBoard();
        });

        // --- user controls ---

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

        // --- go! ---
        renderBoard();
    }
});
