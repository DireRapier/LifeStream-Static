document.addEventListener('DOMContentLoaded', () => {
    renderSidebar();

    // Determine which data load function to call based on page
    const path = window.location.pathname;
    if (path.includes('finance.html')) {
        loadFinancePage();
        setupFinanceModal();
    } else if (path.includes('habits.html')) {
        loadHabitsPage();
    } else if (path.includes('library.html')) {
        loadLibraryPage();
    } else {
        // Default dashboard fetch
        loadDashboard();
    }
});

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

async function loadDashboard() {
    // 1. Greeting
    try {
        const response = await fetch('data.json');
        if (response.ok) {
            const data = await response.json();
            if (data.user) {
                updateGreeting(data.user.name);
            }

            // 2. Habits Logic
            if (data.habits) {
                let totalHabits = data.habits.length;
                let completedCount = 0;

                data.habits.forEach(habit => {
                    if (localStorage.getItem('habit_' + habit.id) === 'true') {
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

                    if (percentage === 100 && message) {
                        message.textContent = "Great Job! 🎉";
                        message.classList.add('text-success');
                    } else if (message) {
                        message.textContent = "";
                    }
                }
            }

            // 3. Finance Logic (Dashboard Summary)
            if (data.finance) {
                let allTransactions = [...data.finance];
                const localTransactionsStr = localStorage.getItem('user_transactions');
                if (localTransactionsStr) {
                    try {
                        const localTransactions = JSON.parse(localTransactionsStr);
                        if (Array.isArray(localTransactions)) {
                            allTransactions = [...allTransactions, ...localTransactions];
                        }
                    } catch (e) {
                        console.error("Error parsing user transactions", e);
                    }
                }

                const MONTHLY_BUDGET = 2500;
                const expenses = allTransactions.filter(item => item.type.toLowerCase() === 'expense');
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
            }
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }

    // 4. Quick Note Logic
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

// Finance Page Logic
async function loadFinancePage() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        let allTransactions = [];

        if (data.finance) {
            allTransactions = [...data.finance];
        }

        // Merge with LocalStorage transactions
        const localTransactionsStr = localStorage.getItem('user_transactions');
        if (localTransactionsStr) {
            try {
                const localTransactions = JSON.parse(localTransactionsStr);
                if (Array.isArray(localTransactions)) {
                    allTransactions = [...allTransactions, ...localTransactions];
                }
            } catch (e) {
                console.error("Error parsing user transactions", e);
            }
        }

        // 1. Calculate Total Monthly Burn (Expenses only)
        const expenses = allTransactions.filter(item => item.type.toLowerCase() === 'expense');
        const totalBurn = expenses.reduce((sum, item) => sum + Number(item.amount), 0);

        const burnElement = document.getElementById('total-burn');
        if (burnElement) {
            burnElement.textContent = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(totalBurn);
        }

        // 2. Render Transaction List
        renderTransactionList(allTransactions);

    } catch (error) {
        console.error('Error loading finance data:', error);
        const burnElement = document.getElementById('total-burn');
        if (burnElement) burnElement.textContent = "$--.--";
    }
}

function renderTransactionList(transactions) {
    const listContainer = document.getElementById('transaction-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';

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

        if (isIncome) {
            formattedCost = '+' + formattedCost;
        }

        costTd.textContent = formattedCost;

        tr.appendChild(iconTd);
        tr.appendChild(nameTd);
        tr.appendChild(catTd);
        tr.appendChild(costTd);

        listContainer.appendChild(tr);
    });
}

function setupFinanceModal() {
    const addBtn = document.getElementById('add-transaction-btn');
    const modal = document.getElementById('transaction-modal');
    const closeBtn = document.getElementById('close-modal-btn');
    const form = document.getElementById('add-transaction-form');

    if (!addBtn || !modal || !closeBtn || !form) return;

    addBtn.addEventListener('click', () => {
        modal.classList.add('active');
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleAddTransaction(form, modal);
    });
}

function handleAddTransaction(form, modal) {
    const nameInput = document.getElementById('transaction-name');
    const amountInput = document.getElementById('transaction-amount');
    const typeInput = document.getElementById('transaction-type');

    if (!nameInput || !amountInput || !typeInput) return;

    const name = nameInput.value;
    const amount = parseFloat(amountInput.value);
    const type = typeInput.value;

    if (!name || isNaN(amount)) return;

    const newTransaction = {
        id: Date.now(),
        name: name,
        amount: amount,
        type: type
    };

    // Save to LocalStorage
    const localTransactionsStr = localStorage.getItem('user_transactions');
    let localTransactions = [];
    if (localTransactionsStr) {
        try {
            localTransactions = JSON.parse(localTransactionsStr);
            if (!Array.isArray(localTransactions)) localTransactions = [];
        } catch (e) {
            localTransactions = [];
        }
    }

    localTransactions.push(newTransaction);
    localStorage.setItem('user_transactions', JSON.stringify(localTransactions));

    // Reset and Close
    form.reset();
    modal.classList.remove('active');

    // Refresh UI
    loadFinancePage();
}

// Habits Page Logic
async function loadHabitsPage() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.habits) {
            renderHabitsGrid(data.habits);
        }
    } catch (error) {
        console.error('Error loading habits data:', error);
    }
}

function renderHabitsGrid(habits) {
    const gridContainer = document.getElementById('habits-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = '';

    habits.forEach(habit => {
        const card = document.createElement('div');
        card.className = 'habit-card';

        const isCompleted = localStorage.getItem('habit_' + habit.id) === 'true';
        if (isCompleted) {
            card.classList.add('completed');
        }

        const icon = document.createElement('i');
        icon.className = habit.icon || 'ri-checkbox-circle-line';

        const name = document.createElement('h3');
        name.textContent = habit.name;

        card.appendChild(icon);
        card.appendChild(name);

        card.addEventListener('click', () => {
            const currentState = card.classList.contains('completed');
            const newState = !currentState;

            if (newState) {
                card.classList.add('completed');
                localStorage.setItem('habit_' + habit.id, 'true');
            } else {
                card.classList.remove('completed');
                localStorage.setItem('habit_' + habit.id, 'false');
            }
        });

        gridContainer.appendChild(card);
    });
}

// Library Page Logic
async function loadLibraryPage() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.library) {
            // Initial render
            renderLibrary(data.library);
            setupLibraryFilters(data.library);
        }
    } catch (error) {
        console.error('Error loading library data:', error);
        const grid = document.getElementById('library-grid');
        if (grid) grid.innerHTML = '<div class="text-center text-muted p-4 col-span-full">Failed to load library.</div>';
    }
}

function renderLibrary(items) {
    const grid = document.getElementById('library-grid');
    if (!grid) return;

    grid.innerHTML = '';

    if (items.length === 0) {
        grid.innerHTML = '<div class="text-center text-muted p-4 col-span-full">No items found.</div>';
        return;
    }

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'library-card';

        const img = document.createElement('img');
        img.src = item.cover;
        img.alt = item.title;
        img.className = 'library-cover';

        const content = document.createElement('div');
        content.className = 'library-content';

        const title = document.createElement('div');
        title.className = 'library-title';
        title.textContent = item.title;
        title.title = item.title; // Tooltip for overflow

        const author = document.createElement('div');
        author.className = 'library-author';
        author.textContent = item.author;

        const rating = document.createElement('div');
        rating.className = 'library-rating';
        rating.innerHTML = getStarRating(item.rating);

        content.appendChild(title);
        content.appendChild(author);
        content.appendChild(rating);

        card.appendChild(img);
        card.appendChild(content);

        grid.appendChild(card);
    });
}

function getStarRating(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="ri-star-fill"></i>';
        } else {
            stars += '<i class="ri-star-line"></i>';
        }
    }
    return stars;
}

function setupLibraryFilters(allItems) {
    const buttons = document.querySelectorAll('.filter-btn');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update Active State
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Filter Data
            const filter = btn.getAttribute('data-filter');

            if (filter === 'all') {
                renderLibrary(allItems);
            } else {
                const filteredItems = allItems.filter(item => item.type === filter);
                renderLibrary(filteredItems);
            }
        });
    });
}
