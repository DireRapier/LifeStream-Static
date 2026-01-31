document.addEventListener('DOMContentLoaded', () => {
    fetchData();
});

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
