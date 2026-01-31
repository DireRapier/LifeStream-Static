document.addEventListener('DOMContentLoaded', () => {
    renderSidebar();
    fetchData();
});

function renderSidebar() {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) return;

    const currentPath = window.location.pathname;
    // Normalize path to handle trailing slashes or index.html
    const filename = currentPath.split('/').pop() || 'index.html';

    // Strict equality check for Dashboard (root / or index.html)
    const isDashboard = filename === '' || filename === 'index.html';

    const navItems = [
        { name: 'Dashboard', icon: 'ri-dashboard-line', link: 'index.html', active: isDashboard },
        { name: 'Finance', icon: 'ri-money-dollar-circle-line', link: 'finance.html', active: filename === 'finance.html' },
        { name: 'Habits', icon: 'ri-checkbox-circle-line', link: 'habits.html', active: filename === 'habits.html' },
        { name: 'Library', icon: 'ri-book-read-line', link: 'library.html', active: filename === 'library.html' },
        { name: 'Settings', icon: 'ri-settings-4-line', link: 'settings.html', active: filename === 'settings.html' }
    ];

    // Build Sidebar HTML
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

        <!-- Mobile Top Bar -->
        <div class="mobile-top-bar">
            <button id="hamburger-btn" class="hamburger-btn">
                <i class="ri-menu-line"></i>
            </button>
            <div class="mobile-logo">LifeStream</div>
            <div style="width: 24px;"></div> <!-- Spacer to center logo roughly -->
        </div>

        <!-- Backdrop -->
        <div id="overlay-backdrop" class="overlay-backdrop"></div>
    `;

    // Inject HTML (replacing the container's content, but actually the container is <aside>,
    // so we should append inside it or replace it.
    // The plan said "Inject INTO #sidebar-container".
    // However, the CSS expects .sidebar to be a child of .dashboard-layout or fixed.
    // Let's replace the inner HTML of the container.
    // Actually, looking at the HTML structure: <aside id="sidebar-container"></aside>
    // And CSS: .sidebar { ... }
    // So if we put <div class="sidebar"> inside <aside>, we get <aside><div class="sidebar">...</div></aside>
    // The CSS .dashboard-layout grid-template-columns: 260px 1fr; applies to the direct children.
    // So <aside> needs to be the sidebar column.
    // If I put .mobile-top-bar inside <aside>, it might be hidden or constrained by grid.
    // Mobile top bar needs to be fixed.

    // Correction: The mobile top bar and backdrop should probably be outside the grid flow or handled carefully.
    // But since I can only inject into #sidebar-container (which is the first child of grid),
    // I need to make sure the structure works.

    // If I inject everything into #sidebar-container:
    // <aside id="sidebar-container">
    //    <div class="sidebar">...</div>
    //    <div class="mobile-top-bar">...</div>
    //    <div class="overlay-backdrop">...</div>
    // </aside>

    // On Desktop: <aside> is grid column 1. .sidebar is height 100vh. .mobile-top-bar is display:none.
    // This works fine.

    // On Mobile: .dashboard-layout is 1fr. <aside> is still there.
    // .sidebar is fixed. .mobile-top-bar is fixed.
    // This implies <aside> itself doesn't need styles, or relies on its children.
    // The CSS for .sidebar has `position: sticky` or `fixed`.
    // Wait, the CSS ` .sidebar` has the styles.
    // If <aside> is just a wrapper, it might collapse or behave weirdly if not styled.
    // In Grid, unstyled div takes up the cell.

    // Let's ensure <aside> itself doesn't interfere.
    // Actually, to keep it clean, maybe I should unwrap or style #sidebar-container?
    // The prompt asked to "Inject this HTML into #sidebar-container".
    // Let's stick to that.

    sidebarContainer.innerHTML = navHtml;

    // Event Listeners for Mobile Menu
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const backdrop = document.getElementById('overlay-backdrop');
    const sidebar = sidebarContainer.querySelector('.sidebar');

    if (hamburgerBtn && sidebar && backdrop) {
        hamburgerBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open'); // Use .open for transform
            // Also toggle backdrop
            backdrop.classList.toggle('active');
            // Change hamburger icon? Optional.
        });

        backdrop.addEventListener('click', () => {
            sidebar.classList.remove('open');
            backdrop.classList.remove('active');
        });

        // Close sidebar when clicking a link on mobile
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
        // Fallback in case of error
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

    habitsContainer.innerHTML = ''; // Clear loading or default text

    habits.forEach(habit => {
        const li = document.createElement('li');
        li.className = 'habit-item';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = habit.name;

        const statusIcon = document.createElement('i');
        // Use Remixicon check circle
        if (habit.status) {
            statusIcon.className = 'ri-checkbox-circle-fill habit-check';
        } else {
            statusIcon.className = 'ri-checkbox-blank-circle-line habit-check inactive';
        }

        li.appendChild(nameSpan);
        li.appendChild(statusIcon);
        habitsContainer.appendChild(li);
    });
}
