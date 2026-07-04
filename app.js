// Saat's Task Tracker - app.js
// Web Tech Project, July 2026
// Built by Saatvik Gupta

document.addEventListener('DOMContentLoaded', function() {

    // grab all the DOM elements I need
    var greetingEl = document.getElementById('greeting');
    var currentDateEl = document.getElementById('current-date');
    var addTaskBtn = document.getElementById('add-task-btn');
    var taskModal = document.getElementById('task-modal');
    var closeModalBtn = document.getElementById('close-modal');
    var cancelTaskBtn = document.getElementById('cancel-task');
    var taskForm = document.getElementById('task-form');
    var modalTitle = document.getElementById('modal-title');
    var modalBackdrop = document.getElementById('modal-backdrop');

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

    // set up the SVG progress circle
    var radius = 46;
    var circumference = 2 * Math.PI * radius;
    progressCircle.style.strokeDasharray = circumference + ' ' + circumference;
    progressCircle.style.strokeDashoffset = circumference;

    // load tasks from localStorage (or start empty)
    var tasks = JSON.parse(localStorage.getItem('saatTasks')) || [];

    // currently active filters
    var currentCategory = 'all';
    var currentDateFilter = 'all';
    var currentSearch = '';

    // set greeting and date
    function setGreeting() {
        var now = new Date();
        var h = now.getHours();
        var name = 'Saatvik';
        var greeting = 'Good evening, ' + name;
        if (h < 12) greeting = 'Good morning, ' + name;
        else if (h < 18) greeting = 'Good afternoon, ' + name;
        greetingEl.textContent = greeting;

        var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        currentDateEl.textContent = days[now.getDay()] + ', ' + months[now.getMonth()] + ' ' + now.getDate();
    }
    setGreeting();

    // save to localStorage
    function saveTasks() {
        localStorage.setItem('saatTasks', JSON.stringify(tasks));
    }

    // update the circular progress ring
    function updateProgressRing(percent) {
        var offset = circumference - (percent / 100) * circumference;
        progressCircle.style.strokeDashoffset = offset;
    }

    // update the stats numbers in sidebar
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

    // check if a task passes the date filter
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

    // check if a task matches search
    function passesSearch(task) {
        if (!currentSearch) return true;
        var q = currentSearch.toLowerCase();
        return task.title.toLowerCase().includes(q) ||
               (task.description && task.description.toLowerCase().includes(q));
    }

    // check category filter
    function passesCategory(task) {
        if (currentCategory === 'all') return true;
        return task.category === currentCategory;
    }

    // format due date string for display
    function formatDue(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr + 'T00:00:00');
        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return months[d.getMonth()] + ' ' + d.getDate();
    }

    // check if a task is overdue
    function isOverdue(task) {
        if (!task.dueDate || task.status === 'done') return false;
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        var due = new Date(task.dueDate + 'T00:00:00');
        return due < today;
    }

    // category emoji helper
    function getCategoryEmoji(cat) {
        var map = { study: '📚', assignment: '📝', personal: '🏠', health: '❤️' };
        return map[cat] || '📋';
    }

    // build and return a task card element
    function makeTaskCard(task) {
        var card = document.createElement('div');
        card.className = 'task-card' + (task.status === 'done' ? ' completed' : '');
        card.setAttribute('data-id', task.id);

        // figure out the action button for changing status
        var statusBtn = '';
        if (task.status === 'todo') {
            statusBtn = '<button class="task-act-btn" onclick="moveTask(\'' + task.id + '\', \'in-progress\')" title="Start">▶</button>';
        } else if (task.status === 'in-progress') {
            statusBtn = '<button class="task-act-btn" onclick="moveTask(\'' + task.id + '\', \'done\')" title="Mark done">✔</button>';
        } else {
            statusBtn = '<button class="task-act-btn" onclick="moveTask(\'' + task.id + '\', \'todo\')" title="Reopen">↩</button>';
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
            '    <button class="task-act-btn" onclick="editTask(\'' + task.id + '\')" title="Edit">✏️</button>',
            '    <button class="task-act-btn" onclick="deleteTask(\'' + task.id + '\')" title="Delete">🗑️</button>',
            '  </div>',
            '</div>'
        ].join('');

        return card;
    }

    // simple html escape to avoid XSS
    function escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // render everything on the board
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

        // empty state messages
        if (todoCnt === 0) {
            var emptyTodo = document.createElement('div');
            emptyTodo.className = 'empty-state';
            emptyTodo.textContent = 'No tasks here — add your first one 👆';
            listTodo.appendChild(emptyTodo);
        }
        if (progressCnt === 0) {
            var emptyProg = document.createElement('div');
            emptyProg.className = 'empty-state';
            emptyProg.textContent = 'Nothing in progress yet';
            listInProgress.appendChild(emptyProg);
        }
        if (doneCnt === 0) {
            var emptyDone = document.createElement('div');
            emptyDone.className = 'empty-state';
            emptyDone.textContent = 'Completed tasks show up here ✅';
            listDone.appendChild(emptyDone);
        }

        countTodoEl.textContent = todoCnt;
        countProgressEl.textContent = progressCnt;
        countDoneEl.textContent = doneCnt;

        updateStats();
    }

    // move a task to a new status
    window.moveTask = function(id, newStatus) {
        for (var i = 0; i < tasks.length; i++) {
            if (tasks[i].id === id) {
                tasks[i].status = newStatus;
                break;
            }
        }
        saveTasks();
        renderBoard();
    };

    // delete a task
    window.deleteTask = function(id) {
        var filtered = [];
        for (var i = 0; i < tasks.length; i++) {
            if (tasks[i].id !== id) filtered.push(tasks[i]);
        }
        tasks = filtered;
        saveTasks();
        renderBoard();
    };

    // open edit modal for a specific task
    window.editTask = function(id) {
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
    };

    // open / close modal helpers
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

    // Esc key closes modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });

    // form submit - add or edit task
    taskForm.addEventListener('submit', function(e) {
        e.preventDefault();

        var id = taskIdInput.value;
        var title = taskTitleInput.value.trim();
        if (!title) return;

        if (id) {
            // editing existing task
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
            // new task
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

    // search input
    searchInput.addEventListener('input', function() {
        currentSearch = this.value.trim();
        renderBoard();
    });

    // category filter buttons
    filterButtons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            filterButtons.forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            currentCategory = btn.getAttribute('data-filter');
            renderBoard();
        });
    });

    // date filter dropdown
    dateFilterSelect.addEventListener('change', function() {
        currentDateFilter = this.value;
        renderBoard();
    });

    // initial render
    renderBoard();
});
