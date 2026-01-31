document.addEventListener('DOMContentLoaded', () => {
    renderSidebar();

    // Determine which data load function to call based on page
    const path = window.location.pathname;
    if (path.includes('finance.html')) {
        loadFinancePage();
    } else if (path.includes('habits.html')) {
        loadHabitsPage();
    } else {
        // Default dashboard fetch
        fetchData();
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

async function fetchData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.user) {
            updateGreeting(data.user.name);
        }

        if (data.habits) {
            renderHabits(data.habits);
        }

    } catch (error) {
        console.error('Error fetching data:', error);
        const greetingElement = document.getElementById('greeting');
        if (greetingElement) {
            greetingElement.textContent = "Welcome, Traveler";
        }
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

function renderHabits(habits) {
    const habitsContainer = document.getElementById('habits-list');
    if (!habitsContainer) return;

    habitsContainer.innerHTML = '';

    habits.forEach(habit => {
        const isCompleted = localStorage.getItem('habit_' + habit.id) === 'true';

        const li = document.createElement('li');
        li.className = 'habit-item';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = habit.name;

        const statusIcon = document.createElement('i');
        if (isCompleted) {
            statusIcon.className = 'ri-checkbox-circle-fill habit-check';
        } else {
            statusIcon.className = 'ri-checkbox-blank-circle-line habit-check inactive';
        }

        li.appendChild(nameSpan);
        li.appendChild(statusIcon);
        habitsContainer.appendChild(li);
    });
}

// Finance Page Logic
async function loadFinancePage() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.finance) {
            const expenses = data.finance.filter(item => item.type.toLowerCase() === 'expense');
            const totalBurn = expenses.reduce((sum, item) => sum + Number(item.amount), 0);

            const burnElement = document.getElementById('total-burn');
            if (burnElement) {
                burnElement.textContent = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(totalBurn);
            }

            renderTransactionList(data.finance);
        }

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

    transactions.forEach(item => {
        const tr = document.createElement('tr');

        const iconTd = document.createElement('td');
        const icon = document.createElement('i');
        icon.className = 'ri-money-dollar-circle-line text-lg text-muted';
        // Removed inline styles here
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
