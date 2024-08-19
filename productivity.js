// productivity.js

// Timer functionality
let timerElement;
let timerSegments;
let timerInterval;
let seconds = 0;
let isCountdown = false;
let countdownSeconds = 0;

export function initializeProductivity() {
    document.addEventListener('DOMContentLoaded', () => {
        timerElement = document.getElementById('timer');
        timerSegments = document.getElementById('timerSegments');
        if (timerElement && timerSegments) {
            setupEventListeners();
        } else {
            console.error('Timer elements not found in the DOM');
        }
        updateRecentClaims();
        updateAvgHourly();
        updateGoalProgress();
    });
}

function setupEventListeners() {
    timerElement.addEventListener('click', toggleTimer);
    timerSegments.addEventListener('click', handleTimerSegments);
    document.getElementById('log-claim-btn').addEventListener('click', logClaim);
    document.getElementById('all-logs-btn').addEventListener('click', showAllLogs);
    document.querySelector('.close-popup').addEventListener('click', closeAllLogs);
}

function updateTimerDisplay(time) {
    const minutes = Math.floor(time / 60);
    const remainingSeconds = time % 60;
    timerElement.textContent = `${padZero(minutes)}:${padZero(remainingSeconds)}`;
}

function padZero(num) {
    return num.toString().padStart(2, '0');
}

function toggleTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    } else {
        startTimer();
    }
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (isCountdown) {
            if (countdownSeconds > 0) {
                countdownSeconds--;
                updateTimerDisplay(countdownSeconds);
            } else {
                clearInterval(timerInterval);
                alert("Timer finished!");
                resetTimer();
            }
        } else {
            seconds++;
            updateTimerDisplay(seconds);
        }
    }, 1000);
}

function resetTimer() {
    clearInterval(timerInterval);
    seconds = 0;
    isCountdown = false;
    updateTimerDisplay(seconds);
}

function setCountdownTimer(minutes) {
    isCountdown = true;
    countdownSeconds = minutes * 60;
    updateTimerDisplay(countdownSeconds);
    startTimer();
}

function handleTimerSegments(e) {
    if (e.target.id === 'timer.break') {
        setCountdownTimer(15);
    } else if (e.target.id === 'timer.lunch') {
        setCountdownTimer(60);
    } else if (e.target.id === 'timer.coaching' || e.target.id === 'timer.training') {
        const minutes = prompt("Enter the number of minutes for the timer:");
        if (minutes) {
            setCountdownTimer(parseInt(minutes));
        }
    }
}

function logClaim() {
    const claimNumber = document.getElementById('field-accountNumber').value;
    const claimScenario = document.getElementById('field-scenario').value;
    const notes = document.getElementById('xOutput').textContent;
    const action = document.getElementById('xD').textContent.split('\n')[0];
    const duration = seconds;
    const timestamp = new Date().toISOString();

    const claimLog = {
        timestamp,
        claimNumber,
        claimScenario,
        notes,
        action,
        duration
    };

    let claimLogs = JSON.parse(localStorage.getItem('claimLogs')) || [];
    claimLogs.unshift(claimLog);
    if (claimLogs.length > 100) claimLogs.pop();
    localStorage.setItem('claimLogs', JSON.stringify(claimLogs));

    updateRecentClaims();
    updateAvgHourly();
    updateGoalProgress();
    resetTimer();
}

function updateRecentClaims() {
    const recentClaimsElement = document.getElementById('recent-claims');
    const claimLogs = JSON.parse(localStorage.getItem('claimLogs')) || [];
    const recentClaims = claimLogs.slice(0, 5);

    recentClaimsElement.innerHTML = recentClaims.map(claim => {
        const durationMinutes = Math.floor(claim.duration / 60);
        let colorClass = 'green';
        if (durationMinutes > 10) colorClass = 'yellow';
        if (durationMinutes > 20) colorClass = 'red';
        return `<div class="recent-claim ${colorClass}">
                    ${claim.claimNumber} - ${durationMinutes} mins
                </div>`;
    }).join('');
}

function updateAvgHourly() {
    const avgHourlyElement = document.getElementById('avg-hourly');
    const claimLogs = JSON.parse(localStorage.getItem('claimLogs')) || [];
    const today = new Date().toDateString();
    const hourlyData = Array(10).fill(0);

    claimLogs.forEach(claim => {
        const claimDate = new Date(claim.timestamp);
        if (claimDate.toDateString() === today) {
            const hour = claimDate.getHours();
            if (hour >= 13 && hour <= 22) {
                hourlyData[hour - 13]++;
            }
        }
    });

    const maxClaims = Math.max(...hourlyData);
    avgHourlyElement.innerHTML = hourlyData.map((count, index) => {
        const height = (count / maxClaims) * 100;
        return `<div class="bar" style="height: ${height}%;" title="${count} claims at ${index + 13}:00"></div>`;
    }).join('');
}

let currentHourClaims = 0;
let currentHour = new Date().getHours();

function updateGoalProgress() {
    const goalElement = document.getElementById('hourly-goal');
    const newHour = new Date().getHours();
    
    if (newHour !== currentHour) {
        currentHourClaims = 0;
        currentHour = newHour;
    }

    currentHourClaims++;
    const progress = (currentHourClaims / 8) * 100;

    goalElement.innerHTML = `
        <svg viewBox="0 0 36 36" class="circular-chart">
            <path class="circle-bg"
                d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path class="circle"
                stroke-dasharray="${progress}, 100"
                d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <text x="18" y="20.35" class="percentage">${currentHourClaims}</text>
        </svg>
    `;

    if (currentHourClaims >= 8) {
        goalElement.classList.add('goal-met');
        setTimeout(() => goalElement.classList.remove('goal-met'), 3000);
    }
}

function showAllLogs() {
    const logsPopup = document.getElementById('logs-popup');
    logsPopup.style.display = 'block';
    const iframe = document.createElement('iframe');
    iframe.src = 'logs.html';
    logsPopup.appendChild(iframe);
}

function closeAllLogs() {
    const logsPopup = document.getElementById('logs-popup');
    logsPopup.style.display = 'none';
    logsPopup.innerHTML = '<span class="close-popup">&times;</span>';
}

// Update every minute
setInterval(() => {
    updateAvgHourly();
    updateGoalProgress();
}, 60000);