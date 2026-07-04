document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    lucide.createIcons();

    // Elements
    const splashScreen = document.getElementById('splash-screen');
    const enterBtn = document.getElementById('enter-btn');
    const appContainer = document.getElementById('app-container');
    const greetingEl = document.getElementById('greeting');
    const currentDateEl = document.getElementById('current-date');
    
    // Task elements
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskModal = document.getElementById('task-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const cancelTaskBtn = document.getElementById('cancel-task');
    const taskForm = document.getElementById('task-form');
    const modalTitle = document.getElementById('modal-title');
    
    // Form fields
    const taskIdInput = document.getElementById('task-id');
    const taskTitleInput = document.getElementById('task-title-input');
    const taskCategorySelect = document.getElementById('task-category');
    const taskPrioritySelect = document.getElementById('task-priority');
    const taskDueDateInput = document.getElementById('task-due-date');
    const taskDescInput = document.getElementById('task-desc');
    
    // Lists
    const listTodo = document.getElementById('list-todo');
    const listInProgress = document.getElementById('list-in-progress');
    const listDone = document.getElementById('list-done');
    
    // Counts & Stats
    const countTodoEl = document.getElementById('count-todo');
    const countProgressEl = document.getElementById('count-progress');
    const countDoneEl = document.getElementById('count-done');
    const statTotalEl = document.getElementById('stat-total');
    const statPendingEl = document.getElementById('stat-pending');
    const completionPercentageEl = document.getElementById('completion-percentage');
    const progressCircle = document.querySelector('.progress-ring__circle');
    
    // Controls
    const searchInput = document.getElementById('search-input');
    const filterButtons = document.querySelectorAll('.filter-btn');

    // Canvas Particle System
    const canvas = document.getElementById('splash-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    const colors = ['#6366f1', '#a855f7', '#38bdf8', '#c084fc', '#818cf8'];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
        constructor(x, y, color, size, vx, vy) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.size = size || Math.random() * 3 + 1.5;
            this.vx = vx || (Math.random() - 0.5) * 4;
            this.vy = vy || (Math.random() - 0.5) * 4;
            this.alpha = 1;
            this.decay = Math.random() * 0.02 + 0.015;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= 0.97;
            this.vy *= 0.97;
            this.alpha -= this.decay;
        }
        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.shadowBlur = 8;
            ctx.shadowColor = this.color;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    function createBurst(x, y, count = 30) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 1.5;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 2 + 1.5;
            particles.push(new Particle(x, y, color, size, vx, vy));
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles = particles.filter(p => p.alpha > 0);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animateParticles);
    }
    animateParticles();

    // Listeners for Particle Bursts
    splashScreen.addEventListener('mousedown', (e) => {
        createBurst(e.clientX, e.clientY, 25);
    });

    const logoContainer = document.getElementById('logo-container');
    if (logoContainer) {
        logoContainer.addEventListener('click', (e) => {
            e.stopPropagation();
            const rect = logoContainer.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            createBurst(centerX, centerY, 55);
        });
    }

    // App State
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    let searchQuery = '';

    // Circular progress configurations
    if (progressCircle) {
        const radius = progressCircle.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
        progressCircle.style.strokeDashoffset = circumference;
    }

    const splashAction = document.querySelector('.splash-action');
    const splashLoaderContainer = document.getElementById('splash-loader-container');
    const loaderStatus = document.getElementById('loader-status');
    const loaderBar = document.getElementById('loader-bar');

    // Set greeting and date
    function updateHeaderInfo() {
        const now = new Date();
        const hours = now.getHours();
        let greeting = 'Good Evening';
        if (hours < 12) greeting = 'Good Morning';
        else if (hours < 18) greeting = 'Good Afternoon';
        
        greetingEl.textContent = `${greeting}, Developer`;
        
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        currentDateEl.textContent = now.toLocaleDateString('en-US', options);
    }
    updateHeaderInfo();

    // Splash Screen Transition Trigger
    let isEntering = false;
    function enterWorkspace() {
        if (isEntering || splashScreen.classList.contains('fade-out')) return;
        isEntering = true;

        // Hide buttons, show loader
        splashAction.classList.add('hidden');
        splashLoaderContainer.classList.remove('hidden');

        let progress = 0;
        const statuses = [
            { limit: 25, text: 'Syncing workspace...' },
            { limit: 55, text: 'Optimizing board columns...' },
            { limit: 85, text: 'Retrieving saved tasks...' },
            { limit: 100, text: 'Ready! Launching...' }
        ];

        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 8) + 4;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                
                // Finalize entry
                loaderBar.style.width = '100%';
                loaderStatus.textContent = statuses[3].text;
                
                setTimeout(() => {
                    splashScreen.classList.add('fade-out');
                    appContainer.classList.remove('hidden');
                    setTimeout(() => {
                        splashScreen.style.display = 'none';
                    }, 600);
                }, 400);
            } else {
                loaderBar.style.width = `${progress}%`;
                const currentStatus = statuses.find(s => progress <= s.limit) || statuses[2];
                loaderStatus.textContent = currentStatus.text;
            }
        }, 80);
    }

    enterBtn.addEventListener('click', enterWorkspace);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            enterWorkspace();
        }
    });

    // Save tasks to local storage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // Calculate and update workspace progress stats
    function updateStats() {
        const total = tasks.length;
        const todo = tasks.filter(t => t.status === 'todo').length;
        const progress = tasks.filter(t => t.status === 'in-progress').length;
        const done = tasks.filter(t => t.status === 'done').length;

        countTodoEl.textContent = todo;
        countProgressEl.textContent = progress;
        countDoneEl.textContent = done;

        statTotalEl.textContent = total;
        statPendingEl.textContent = todo + progress;

        const percentage = total === 0 ? 0 : Math.round((done / total) * 100);
        completionPercentageEl.textContent = `${percentage}%`;

        // Update progress ring
        if (progressCircle) {
            const radius = progressCircle.r.baseVal.value;
            const circumference = radius * 2 * Math.PI;
            const offset = circumference - (percentage / 100) * circumference;
            progressCircle.style.strokeDashoffset = offset;
        }
    }

    // Generate HTML for a task card
    function createTaskCard(task) {
        const card = document.createElement('div');
        card.className = `task-card ${task.status === 'done' ? 'completed' : ''}`;
        card.setAttribute('data-id', task.id);
        
        // Priority color class
        const priorityClass = `priority-${task.priority}`;
        
        // Category Icon selection
        let categoryIcon = 'layers';
        if (task.category === 'work') categoryIcon = 'briefcase';
        else if (task.category === 'personal') categoryIcon = 'user';
        else if (task.category === 'shopping') categoryIcon = 'shopping-bag';
        else if (task.category === 'health') categoryIcon = 'heart';

        // Format Date
        let dateHtml = '';
        if (task.dueDate) {
            const dateObj = new Date(task.dueDate);
            const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            dateHtml = `
                <div class="task-meta-item">
                    <i data-lucide="calendar"></i>
                    <span>${formattedDate}</span>
                </div>
            `;
        }

        // Action icons depending on status
        let progressActionBtn = '';
        if (task.status === 'todo') {
            progressActionBtn = `
                <button class="task-action-btn btn-complete" onclick="changeTaskStatus('${task.id}', 'in-progress')" title="Start Progress">
                    <i data-lucide="play"></i>
                </button>
            `;
        } else if (task.status === 'in-progress') {
            progressActionBtn = `
                <button class="task-action-btn btn-complete" onclick="changeTaskStatus('${task.id}', 'done')" title="Complete Task">
                    <i data-lucide="check"></i>
                </button>
            `;
        } else if (task.status === 'done') {
            progressActionBtn = `
                <button class="task-action-btn btn-complete" onclick="changeTaskStatus('${task.id}', 'todo')" title="Reopen Task">
                    <i data-lucide="rotate-ccw"></i>
                </button>
            `;
        }

        card.innerHTML = `
            <div class="task-card-header">
                <h3 class="task-card-title">${escapeHTML(task.title)}</h3>
                <span class="task-priority-badge ${priorityClass}">${task.priority}</span>
            </div>
            ${task.description ? `<p class="task-desc">${escapeHTML(task.description)}</p>` : ''}
            <div class="task-card-footer">
                <div class="task-meta">
                    <div class="task-meta-item">
                        <i data-lucide="${categoryIcon}"></i>
                        <span style="text-transform: capitalize;">${task.category}</span>
                    </div>
                    ${dateHtml}
                </div>
                <div class="task-card-actions">
                    ${progressActionBtn}
                    <button class="task-action-btn btn-edit" onclick="openEditModal('${task.id}')" title="Edit Task">
                        <i data-lucide="edit-3"></i>
                    </button>
                    <button class="task-action-btn btn-delete" onclick="deleteTask('${task.id}')" title="Delete Task">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `;

        return card;
    }

    // Escape raw HTML strings for security
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    // Render workspace board columns
    function renderBoard() {
        listTodo.innerHTML = '';
        listInProgress.innerHTML = '';
        listDone.innerHTML = '';

        const filteredTasks = tasks.filter(task => {
            const matchesCategory = currentFilter === 'all' || task.category === currentFilter;
            const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  task.description.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });

        filteredTasks.forEach(task => {
            const card = createTaskCard(task);
            if (task.status === 'todo') {
                listTodo.appendChild(card);
            } else if (task.status === 'in-progress') {
                listInProgress.appendChild(card);
            } else if (task.status === 'done') {
                listDone.appendChild(card);
            }
        });

        // Initialize Lucide Icons for dynamic content
        lucide.createIcons();
        updateStats();
    }

    // Status changer
    window.changeTaskStatus = (id, newStatus) => {
        tasks = tasks.map(t => t.id === id ? { ...t, status: newStatus } : t);
        saveTasks();
        renderBoard();
    };

    // Delete tasks
    window.deleteTask = (id) => {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderBoard();
    };

    // Open Create Modal
    addTaskBtn.addEventListener('click', () => {
        modalTitle.textContent = 'Create Task';
        taskIdInput.value = '';
        taskForm.reset();
        
        // Set today as default date
        const today = new Date().toISOString().split('T')[0];
        taskDueDateInput.value = today;
        
        taskModal.classList.remove('hidden');
    });

    // Close Modal helper
    function closeModal() {
        taskModal.classList.add('hidden');
    }
    closeModalBtn.addEventListener('click', closeModal);
    cancelTaskBtn.addEventListener('click', closeModal);

    // Form Submission
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const id = taskIdInput.value;
        const title = taskTitleInput.value.trim();
        const category = taskCategorySelect.value;
        const priority = taskPrioritySelect.value;
        const dueDate = taskDueDateInput.value;
        const description = taskDescInput.value.trim();

        if (id) {
            // Edit existing
            tasks = tasks.map(t => t.id === id ? { ...t, title, category, priority, dueDate, description } : t);
        } else {
            // Create new
            const newTask = {
                id: Date.now().toString(),
                title,
                category,
                priority,
                dueDate,
                description,
                status: 'todo'
            };
            tasks.push(newTask);
        }

        saveTasks();
        renderBoard();
        closeModal();
    });

    // Open Edit Modal
    window.openEditModal = (id) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        modalTitle.textContent = 'Edit Task';
        taskIdInput.value = task.id;
        taskTitleInput.value = task.title;
        taskCategorySelect.value = task.category;
        taskPrioritySelect.value = task.priority;
        taskDueDateInput.value = task.dueDate || '';
        taskDescInput.value = task.description || '';

        taskModal.classList.remove('hidden');
    };

    // Search input handler
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderBoard();
    });

    // Filter toggle handler
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => b.classList.remove('active'));
            const button = e.target.closest('.filter-btn');
            button.classList.add('active');
            currentFilter = button.getAttribute('data-filter');
            renderBoard();
        });
    });

    // Initial load
    renderBoard();
});
