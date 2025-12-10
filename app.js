const API_BASE_URL = 'https://to-do-server-jd4c.onrender.com/api';
let currentUserEmail = localStorage.getItem('userEmail') || '';
let currentDate = new Date().toISOString().split('T')[0];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateCurrentDate();
    setUserEmail(true);
    showPage('dashboard');
    loadTasks();
    loadExpenses();
});

// Update current date display
function updateCurrentDate() {
    const date = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = date.toLocaleDateString('en-US', options);
    
    // Set default dates
    document.getElementById('taskDate').value = currentDate;
    document.getElementById('expenseDate').value = currentDate;
    document.getElementById('dailyReportDate').value = currentDate;
    
    const now = new Date();
    document.getElementById('monthlyReportDate').value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Set User Email (stored once, reused)
function setUserEmail(isInit = false) {
    const input = document.getElementById('userEmailInput');
    if (input && input.value) {
        currentUserEmail = input.value.trim().toLowerCase();
        localStorage.setItem('userEmail', currentUserEmail);
    } else if (input && currentUserEmail) {
        input.value = currentUserEmail;
    } else if (!currentUserEmail && !isInit) {
        alert('Please enter an email to load your data');
        return;
    }
    document.getElementById('currentUserId').textContent = currentUserEmail
        ? `Current Email: ${currentUserEmail}`
        : 'No email set';
    if (!isInit || currentUserEmail) {
        loadTasks();
        loadExpenses();
    }
}

// Navigation
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });
    document.getElementById(pageName).classList.remove('hidden');
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-indigo-600', 'text-white');
        btn.classList.add('bg-gray-200', 'text-gray-700');
    });
    event.target.classList.add('active', 'bg-indigo-600', 'text-white');
    event.target.classList.remove('bg-gray-200', 'text-gray-700');
    
    if (pageName === 'daily-report') {
        loadDailyReport();
    } else if (pageName === 'monthly-report') {
        loadMonthlyReport();
    }
}

// Task Management
async function loadTasks() {
    if (!currentUserEmail) return;
    const date = document.getElementById('taskDate').value || currentDate;
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${currentUserEmail}/${date}`);
        const tasks = await response.json();
        displayTasks(tasks);
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

function displayTasks(tasks) {
    const tasksList = document.getElementById('tasksList');
    if (tasks.length === 0) {
        tasksList.innerHTML = '<p class="text-gray-500 text-center py-4">No tasks for this date</p>';
        return;
    }
    
    tasksList.innerHTML = tasks.map(task => `
        <div class="task-item flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div class="flex items-center gap-3 flex-1">
                <input type="checkbox" ${task.completed ? 'checked' : ''} 
                       onchange="toggleTask('${task._id}', this.checked)"
                       class="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500">
                <span class="${task.completed ? 'completed' : ''} flex-1">${task.title}</span>
            </div>
            <button onclick="deleteTask('${task._id}')" 
                    class="ml-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm">
                Delete
            </button>
        </div>
    `).join('');
}

async function addTask() {
    const title = document.getElementById('taskInput').value.trim();
    const date = document.getElementById('taskDate').value || currentDate;
    
    if (!title) {
        alert('Please enter a task title');
        return;
    }
    if (!currentUserEmail) {
        alert('Please set your email first');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUserEmail, title, date })
        });
        
        if (response.ok) {
            document.getElementById('taskInput').value = '';
            loadTasks();
        }
    } catch (error) {
        console.error('Error adding task:', error);
        alert('Error adding task');
    }
}

async function toggleTask(taskId, completed) {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed })
        });
        
        if (response.ok) {
            loadTasks();
        }
    } catch (error) {
        console.error('Error updating task:', error);
    }
}

async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadTasks();
        }
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}

// Expense Management
async function loadExpenses() {
    if (!currentUserEmail) return;
    const date = document.getElementById('expenseDate').value || currentDate;
    try {
        const response = await fetch(`${API_BASE_URL}/expenses/${currentUserEmail}/${date}`);
        const expenses = await response.json();
        displayExpenses(expenses);
    } catch (error) {
        console.error('Error loading expenses:', error);
    }
}

function displayExpenses(expenses) {
    const expensesList = document.getElementById('expensesList');
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    if (expenses.length === 0) {
        expensesList.innerHTML = '<p class="text-gray-500 text-center py-4">No expenses for this date</p>';
    } else {
        expensesList.innerHTML = expenses.map(expense => `
            <div class="expense-item flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div class="flex-1">
                    <p class="font-semibold text-gray-800">$${expense.amount.toFixed(2)}</p>
                    ${expense.description ? `<p class="text-sm text-gray-600">${expense.description}</p>` : ''}
                </div>
                <button onclick="deleteExpense('${expense._id}')" 
                        class="ml-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm">
                    Delete
                </button>
            </div>
        `).join('');
    }
    
    document.getElementById('totalExpense').textContent = `$${total.toFixed(2)}`;
}

async function addExpense() {
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const description = document.getElementById('expenseDescription').value.trim();
    const date = document.getElementById('expenseDate').value || currentDate;
    
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    if (!currentUserEmail) {
        alert('Please set your email first');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUserEmail, amount, description, date })
        });
        
        if (response.ok) {
            document.getElementById('expenseAmount').value = '';
            document.getElementById('expenseDescription').value = '';
            loadExpenses();
        }
    } catch (error) {
        console.error('Error adding expense:', error);
        alert('Error adding expense');
    }
}

async function deleteExpense(expenseId) {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/expenses/${expenseId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadExpenses();
        }
    } catch (error) {
        console.error('Error deleting expense:', error);
    }
}

// Daily Report
async function loadDailyReport() {
    if (!currentUserEmail) {
        document.getElementById('dailyReportContent').innerHTML = '<p class="text-gray-600">Set your email to view reports.</p>';
        return;
    }
    const date = document.getElementById('dailyReportDate').value || currentDate;
    try {
        const response = await fetch(`${API_BASE_URL}/reports/daily/${currentUserEmail}/${date}`);
        const report = await response.json();
        displayDailyReport(report, date);
    } catch (error) {
        console.error('Error loading daily report:', error);
        document.getElementById('dailyReportContent').innerHTML = '<p class="text-red-500">Error loading report</p>';
    }
}

function displayDailyReport(report, date) {
    const reportDate = new Date(date).toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    
    const stars = '★'.repeat(Math.floor(report.productivityRating)) + 
                  (report.productivityRating % 1 >= 0.5 ? '½' : '') +
                  '☆'.repeat(5 - Math.ceil(report.productivityRating));
    
    document.getElementById('dailyReportContent').innerHTML = `
        <div class="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-lg border border-indigo-200">
            <h3 class="text-xl font-bold text-indigo-800 mb-4">${reportDate}</h3>
            <div class="space-y-4">
                <div class="bg-white p-4 rounded-lg shadow">
                    <p class="text-sm text-gray-600">Tasks Created</p>
                    <p class="text-2xl font-bold text-indigo-600">${report.tasksCreated}</p>
                </div>
                <div class="bg-white p-4 rounded-lg shadow">
                    <p class="text-sm text-gray-600">Tasks Completed</p>
                    <p class="text-2xl font-bold text-green-600">${report.tasksCompleted}</p>
                </div>
                <div class="bg-white p-4 rounded-lg shadow">
                    <p class="text-sm text-gray-600">Productivity Rating</p>
                    <p class="text-2xl font-bold text-yellow-600">${report.productivityRating.toFixed(2)} / 5</p>
                    <p class="text-lg star-rating mt-1">${stars}</p>
                </div>
                <div class="bg-white p-4 rounded-lg shadow">
                    <p class="text-sm text-gray-600">Day's Spend</p>
                    <p class="text-2xl font-bold text-green-600">$${report.daySpend.toFixed(2)}</p>
                </div>
            </div>
        </div>
    `;
}

// Monthly Report
async function loadMonthlyReport() {
    if (!currentUserEmail) {
        document.getElementById('monthlyReportContent').innerHTML = '<p class="text-gray-600">Set your email to view reports.</p>';
        return;
    }
    const monthInput = document.getElementById('monthlyReportDate').value;
    const [year, month] = monthInput.split('-');
    
    try {
        const response = await fetch(`${API_BASE_URL}/reports/monthly/${currentUserEmail}/${year}/${month}`);
        const report = await response.json();
        displayMonthlyReport(report);
    } catch (error) {
        console.error('Error loading monthly report:', error);
        document.getElementById('monthlyReportContent').innerHTML = '<p class="text-red-500">Error loading report</p>';
    }
}

function displayMonthlyReport(report) {
    const monthName = new Date(report.year, report.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    document.getElementById('monthlyReportContent').innerHTML = `
        <div class="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
            <h3 class="text-2xl font-bold text-purple-800 mb-6">${monthName}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div class="bg-white p-5 rounded-lg shadow">
                    <p class="text-sm text-gray-600 mb-2">Total Monthly Spend</p>
                    <p class="text-3xl font-bold text-green-600">$${report.totalSpend.toFixed(2)}</p>
                </div>
                <div class="bg-white p-5 rounded-lg shadow">
                    <p class="text-sm text-gray-600 mb-2">Average Daily Spend</p>
                    <p class="text-3xl font-bold text-blue-600">$${report.averageSpend.toFixed(2)}</p>
                </div>
                <div class="bg-white p-5 rounded-lg shadow">
                    <p class="text-sm text-gray-600 mb-2">Total Completed Tasks</p>
                    <p class="text-3xl font-bold text-indigo-600">${report.totalCompletedTasks}</p>
                </div>
                <div class="bg-white p-5 rounded-lg shadow">
                    <p class="text-sm text-gray-600 mb-2">Average Productivity</p>
                    <p class="text-3xl font-bold text-yellow-600">${report.averageProductivity.toFixed(2)} / 5</p>
                </div>
            </div>
            <div class="bg-white p-5 rounded-lg shadow">
                <p class="text-sm text-gray-600 mb-2">Total Tasks Created</p>
                <p class="text-2xl font-bold text-gray-800">${report.totalTasksCreated}</p>
            </div>
            <div class="bg-white p-5 rounded-lg shadow mt-4">
                <p class="text-sm text-gray-600 mb-2">Days with Data</p>
                <p class="text-2xl font-bold text-gray-800">${report.daysWithData}</p>
            </div>
        </div>
    `;
}

// Event listeners for date changes
document.getElementById('taskDate')?.addEventListener('change', loadTasks);
document.getElementById('expenseDate')?.addEventListener('change', loadExpenses);

