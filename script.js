document.addEventListener('DOMContentLoaded', () => {
    renderSidebar();

    // Determine which page logic to load
    const path = window.location.pathname;
    if (path.includes('finance.html')) {
        loadFinancePage();
        setupFinanceModal();
    } else if (path.includes('habits.html')) {
        loadHabitsPage();
        setupHabitModal();
    } else if (path.includes('library.html')) {
        loadLibraryPage();
        setupLibraryModal();
    } else if (path.includes('settings.html')) {
        loadSettingsPage();
    } else {
        // Default dashboard fetch
        loadDashboard();
    }
});

// --- GLOBAL UTILITIES ---

function getCollection(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}

function saveCollection(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function getTodayString() {
    return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format is stable
}

// --- SHARED UI LOGIC ---

function renderSidebar() {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) return;

    const currentPath = window.location.pathname;
    const filename = currentPath.split('/').pop() || 'index.html';
    const isDashboard = filename === '' || filename === 'index.html';

    const navItems = [
        { name: 'Dashboard', icon: 'ri-dashboard-line', link: 'index.html', active: isDashboard },
        { name: 'Finance', icon: 'ri-money-dollar-circle-line', link: 'finance.html', active: filename === 'finance.html' },
        { name: 'Habits', icon: 'ri-checkbox-circle-line', link: 'habits.html', active: filename === 'habits.html' },
        { name: 'Library', icon: 'ri-book-read-line', link: 'library.html', active: filename === 'library.html' },
        { name: 'Settings', icon: 'ri-settings-4-line', link: 'settings.html', active: filename === 'settings.html' }
    ];

    let navHtml = `
        <div class="sidebar">
            <div class="sidebar-logo">
                <i class="ri-lifebuoy-line"></i> LifeStream
            </div>
            <nav class="sidebar-nav">
    `;

    navItems.forEach(item => {
        const activeClass = item.active ? 'active' : '';
        navHtml += `
            <a href="${item.link}" class="nav-item ${activeClass}">
                <i class="${item.icon}"></i>
                ${item.name}
            </a>
        `;
    });

    navHtml += `
            </nav>
        </div>

        <div class="mobile-top-bar">
            <button id="hamburger-btn" class="hamburger-btn">
                <i class="ri-menu-line"></i>
            </button>
            <div class="mobile-logo">LifeStream</div>
            <div class="spacer-24"></div>
        </div>

        <div id="overlay-backdrop" class="overlay-backdrop"></div>
    `;

    sidebarContainer.innerHTML = navHtml;

    const hamburgerBtn = document.getElementById('hamburger-btn');
    const backdrop = document.getElementById('overlay-backdrop');
    const sidebar = sidebarContainer.querySelector('.sidebar');

    if (hamburgerBtn && sidebar && backdrop) {
        hamburgerBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            backdrop.classList.toggle('active');
        });

        backdrop.addEventListener('click', () => {
            sidebar.classList.remove('open');
            backdrop.classList.remove('active');
        });

        const links = sidebar.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth < 768) {
                     sidebar.classList.remove('open');
                     backdrop.classList.remove('active');
                }
            });
        });
    }
}

function updateGreeting(name) {
    const greetingElement = document.getElementById('greeting');
    if (!greetingElement) return;

    const hour = new Date().getHours();
    let greetingText = 'Hello';

    if (hour >= 5 && hour < 12) {
        greetingText = 'Good Morning';
    } else if (hour >= 12 && hour < 18) {
        greetingText = 'Good Afternoon';
    } else {
        greetingText = 'Good Evening';
    }

    greetingElement.textContent = `${greetingText}, ${name}`;
}

// --- DASHBOARD LOGIC ---

function loadDashboard() {
    updateGreeting("Traveler"); // Default name since user config is removed

    // 1. Habits Logic (Progress)
    const habits = getCollection('habits');
    const totalHabits = habits.length;
    let completedCount = 0;
    const today = getTodayString();

    habits.forEach(habit => {
        if (habit.completedDates && habit.completedDates.includes(today)) {
            completedCount++;
        }
    });

    const countText = document.getElementById('habit-count-text');
    const message = document.getElementById('habit-message');
    const fill = document.getElementById('habit-progress-fill');

    if (countText && fill) {
        countText.textContent = `${completedCount} of ${totalHabits} Completed`;
        const percentage = totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0;
        fill.style.width = `${percentage}%`;

        if (percentage === 100 && totalHabits > 0 && message) {
            message.textContent = "Great Job! 🎉";
            message.classList.add('text-success');
        } else if (message) {
            message.textContent = "";
        }
    }

    // 2. Finance Logic (Summary)
    const transactions = getCollection('finance');
    const MONTHLY_BUDGET = 2500;
    const expenses = transactions.filter(item => item.type.toLowerCase() === 'expense');
    const totalBurn = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
    const remaining = MONTHLY_BUDGET - totalBurn;

    const budgetEl = document.getElementById('dashboard-budget');
    const spentEl = document.getElementById('dashboard-spent');
    const remainingEl = document.getElementById('dashboard-remaining');

    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    });

    if (budgetEl) budgetEl.textContent = formatter.format(MONTHLY_BUDGET);
    if (spentEl) spentEl.textContent = formatter.format(totalBurn);
    if (remainingEl) {
        remainingEl.textContent = formatter.format(remaining);
        if (remaining < 0) {
            remainingEl.className = 'text-danger';
        } else {
            remainingEl.className = 'text-success';
        }
    }

    // 3. Quick Note Logic
    const noteArea = document.getElementById('dashboard-note');
    if (noteArea) {
        const savedNote = localStorage.getItem('quick_note');
        if (savedNote) {
            noteArea.value = savedNote;
        }
        noteArea.addEventListener('input', () => {
            localStorage.setItem('quick_note', noteArea.value);
        });
    }
}

// --- FINANCE PAGE LOGIC ---

function loadFinancePage() {
    const transactions = getCollection('finance');

    // 1. Calculate Total Monthly Burn
    const expenses = transactions.filter(item => item.type.toLowerCase() === 'expense');
    const totalBurn = expenses.reduce((sum, item) => sum + Number(item.amount), 0);

    const burnElement = document.getElementById('total-burn');
    if (burnElement) {
        burnElement.textContent = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(totalBurn);
    }

    // 2. Render Transaction List
    renderTransactionList(transactions);
}

function renderTransactionList(transactions) {
    const listContainer = document.getElementById('transaction-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    if (transactions.length === 0) {
        listContainer.innerHTML = '<tr><td colspan="5" class="text-center text-muted p-4">No transactions yet. Add one to start.</td></tr>';
        return;
    }

    // Reverse to show newest first
    const reversedTransactions = [...transactions].reverse();

    reversedTransactions.forEach(item => {
        const tr = document.createElement('tr');

        const iconTd = document.createElement('td');
        const icon = document.createElement('i');
        icon.className = 'ri-money-dollar-circle-line text-lg text-muted';
        iconTd.appendChild(icon);

        const nameTd = document.createElement('td');
        nameTd.textContent = item.name;

        const catTd = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = item.type;
        catTd.appendChild(badge);

        const costTd = document.createElement('td');
        const isIncome = item.type.toLowerCase() === 'income';
        const amountClass = isIncome ? 'text-success' : '';
        costTd.className = `text-right amount-cell ${amountClass}`;

        let formattedCost = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(item.amount);

        if (isIncome) formattedCost = '+' + formattedCost;
        costTd.textContent = formattedCost;

        // Delete Button
        const actionTd = document.createElement('td');
        actionTd.className = 'text-right';
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-icon-sm text-danger';
        deleteBtn.innerHTML = '<i class="ri-delete-bin-line"></i>';
        deleteBtn.onclick = () => deleteTransaction(item.id);
        actionTd.appendChild(deleteBtn);

        tr.appendChild(iconTd);
        tr.appendChild(nameTd);
        tr.appendChild(catTd);
        tr.appendChild(costTd);
        tr.appendChild(actionTd);

        listContainer.appendChild(tr);
    });
}

function setupFinanceModal() {
    const addBtn = document.getElementById('add-transaction-btn');
    const modal = document.getElementById('transaction-modal');
    const closeBtn = document.getElementById('close-modal-btn');
    const form = document.getElementById('add-transaction-form');

    if (!addBtn || !modal || !closeBtn || !form) return;

    addBtn.addEventListener('click', () => modal.classList.add('active'));
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('transaction-name').value;
        const amount = parseFloat(document.getElementById('transaction-amount').value);
        const type = document.getElementById('transaction-type').value;

        if (!name || isNaN(amount)) return;

        const newTransaction = {
            id: Date.now(),
            name,
            amount,
            type
        };

        const transactions = getCollection('finance');
        transactions.push(newTransaction);
        saveCollection('finance', transactions);

        form.reset();
        modal.classList.remove('active');
        loadFinancePage();
    });
}

function deleteTransaction(id) {
    if (confirm("Delete this transaction?")) {
        let transactions = getCollection('finance');
        transactions = transactions.filter(t => t.id !== id);
        saveCollection('finance', transactions);
        loadFinancePage();
    }
}

// --- HABITS PAGE LOGIC ---

function loadHabitsPage() {
    const habits = getCollection('habits');
    renderHabitsGrid(habits);
}

function renderHabitsGrid(habits) {
    const gridContainer = document.getElementById('habits-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = '';

    if (habits.length === 0) {
        gridContainer.innerHTML = '<div class="text-center text-muted p-4 col-span-full">No habits yet. Create one!</div>';
        return;
    }

    const today = getTodayString();

    habits.forEach(habit => {
        const card = document.createElement('div');
        card.className = 'habit-card';
        card.style.position = 'relative'; // For delete button positioning

        const isCompleted = habit.completedDates && habit.completedDates.includes(today);
        if (isCompleted) {
            card.classList.add('completed');
        }

        // Delete Button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-icon-sm text-muted';
        deleteBtn.style.position = 'absolute';
        deleteBtn.style.top = '10px';
        deleteBtn.style.right = '10px';
        deleteBtn.innerHTML = '<i class="ri-close-line"></i>';
        deleteBtn.onclick = (e) => {
            e.stopPropagation(); // Prevent card click
            deleteHabit(habit.id);
        };

        const icon = document.createElement('i');
        icon.className = habit.icon || 'ri-checkbox-circle-line';

        const name = document.createElement('h3');
        name.textContent = habit.name;

        card.appendChild(deleteBtn);
        card.appendChild(icon);
        card.appendChild(name);

        // Toggle Logic
        card.addEventListener('click', () => {
            const currentHabits = getCollection('habits');
            const targetHabit = currentHabits.find(h => h.id === habit.id);

            if (targetHabit) {
                if (!targetHabit.completedDates) targetHabit.completedDates = [];

                if (targetHabit.completedDates.includes(today)) {
                    targetHabit.completedDates = targetHabit.completedDates.filter(d => d !== today);
                    card.classList.remove('completed');
                } else {
                    targetHabit.completedDates.push(today);
                    card.classList.add('completed');
                }
                saveCollection('habits', currentHabits);
            }
        });

        gridContainer.appendChild(card);
    });
}

function setupHabitModal() {
    // Note: HTML setup for habit modal needs to be added in refactor step
    const addBtn = document.getElementById('add-habit-btn');
    const modal = document.getElementById('habit-modal');
    const closeBtn = document.getElementById('close-habit-modal-btn');
    const form = document.getElementById('add-habit-form');

    if (!addBtn || !modal || !closeBtn || !form) return;

    addBtn.addEventListener('click', () => modal.classList.add('active'));
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('habit-name').value;
        const icon = document.getElementById('habit-icon').value || 'ri-run-line';

        const newHabit = {
            id: Date.now(),
            name,
            icon,
            completedDates: []
        };

        const habits = getCollection('habits');
        habits.push(newHabit);
        saveCollection('habits', habits);

        form.reset();
        modal.classList.remove('active');
        loadHabitsPage();
    });
}

function deleteHabit(id) {
    if (confirm("Delete this habit permanently?")) {
        let habits = getCollection('habits');
        habits = habits.filter(h => h.id !== id);
        saveCollection('habits', habits);
        loadHabitsPage();
    }
}

// --- LIBRARY PAGE LOGIC ---

function loadLibraryPage() {
    const library = getCollection('library');
    renderLibrary(library);
    setupLibraryFilters(library);
}

function renderLibrary(items) {
    const grid = document.getElementById('library-grid');
    if (!grid) return;

    grid.innerHTML = '';

    if (items.length === 0) {
        grid.innerHTML = '<div class="text-center text-muted p-4 col-span-full">No items yet. Add one!</div>';
        return;
    }

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'library-card';
        card.style.position = 'relative';

        // Delete Button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-icon-sm text-danger';
        deleteBtn.style.position = 'absolute';
        deleteBtn.style.top = '10px';
        deleteBtn.style.right = '10px';
        deleteBtn.style.zIndex = '10';
        deleteBtn.style.background = 'rgba(0,0,0,0.5)';
        deleteBtn.style.borderRadius = '50%';
        deleteBtn.innerHTML = '<i class="ri-delete-bin-line"></i>';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteLibraryItem(item.id);
        };

        const img = document.createElement('img');
        img.src = item.cover || 'https://placehold.co/200x300/18181b/FFF?text=No+Cover';
        img.alt = item.title;
        img.className = 'library-cover';

        const content = document.createElement('div');
        content.className = 'library-content';

        const title = document.createElement('div');
        title.className = 'library-title';
        title.textContent = item.title;
        title.title = item.title;

        const author = document.createElement('div');
        author.className = 'library-author';
        author.textContent = item.author;

        const rating = document.createElement('div');
        rating.className = 'library-rating';
        rating.innerHTML = getStarRating(item.rating);

        content.appendChild(title);
        content.appendChild(author);
        content.appendChild(rating);

        card.appendChild(deleteBtn);
        card.appendChild(img);
        card.appendChild(content);

        grid.appendChild(card);
    });
}

function setupLibraryModal() {
    const addBtn = document.getElementById('add-resource-btn');
    const modal = document.getElementById('library-modal');
    const closeBtn = document.getElementById('close-library-modal-btn');
    const form = document.getElementById('add-library-form');

    if (!addBtn || !modal || !closeBtn || !form) return;

    addBtn.addEventListener('click', () => modal.classList.add('active'));
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const title = document.getElementById('lib-title').value;
        const author = document.getElementById('lib-author').value;
        const type = document.getElementById('lib-type').value;
        const rating = parseInt(document.getElementById('lib-rating').value);
        const cover = document.getElementById('lib-cover').value;

        const newItem = {
            id: Date.now(),
            title,
            author,
            type,
            rating,
            cover
        };

        const library = getCollection('library');
        library.push(newItem);
        saveCollection('library', library);

        form.reset();
        modal.classList.remove('active');
        loadLibraryPage();
    });
}

function deleteLibraryItem(id) {
    if (confirm("Delete this item?")) {
        let library = getCollection('library');
        library = library.filter(i => i.id !== id);
        saveCollection('library', library);
        loadLibraryPage();
    }
}

// --- SETTINGS LOGIC ---

function loadSettingsPage() {
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importInput = document.getElementById('import-input');
    const resetBtn = document.getElementById('reset-btn');

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const backupData = {
                finance: getCollection('finance'),
                habits: getCollection('habits'),
                library: getCollection('library'),
                quick_note: localStorage.getItem('quick_note')
            };

            const dataStr = JSON.stringify(backupData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'lifestream_backup.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    if (importBtn && importInput) {
        importBtn.addEventListener('click', () => importInput.click());

        importInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);

                    if (data.finance) saveCollection('finance', data.finance);
                    if (data.habits) saveCollection('habits', data.habits);
                    if (data.library) saveCollection('library', data.library);
                    if (data.quick_note) localStorage.setItem('quick_note', data.quick_note);

                    alert('Data Restored Successfully!');
                    location.reload();
                } catch (err) {
                    console.error(err);
                    alert('Invalid backup file.');
                }
            };
            reader.readAsText(file);
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm("Are you sure? This will wipe all your data permanently.")) {
                localStorage.clear();
                alert('App Reset. All local data cleared.');
                location.reload();
            }
        });
    }
}

// Helper Functions
function getStarRating(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += i <= rating ? '<i class="ri-star-fill"></i>' : '<i class="ri-star-line"></i>';
    }
    return stars;
}

function setupLibraryFilters(allItems) {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.getAttribute('data-filter');
            if (filter === 'all') {
                renderLibrary(allItems);
            } else {
                renderLibrary(allItems.filter(item => item.type === filter));
            }
        });
    });
}
