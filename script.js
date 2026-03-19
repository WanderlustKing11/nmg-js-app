
// FIREBASE INITIALIZATION
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, startAfter, where, getDoc, doc, updateDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCZZaDZbrA5gHTu1XRKcTp2EyAe00-bT0s",
    authDomain: "numbers-memory-game-ffbbe.firebaseapp.com",
    projectId: "numbers-memory-game-ffbbe",
    storageBucket: "numbers-memory-game-ffbbe.firebasestorage.app",
    messagingSenderId: "760510242405",
    appId: "1:760510242405:web:b15e817ac9a92def78308c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// GLOBAL VARIABLES
let score = 0
let currentRGN = 0;
let gameState = 'waiting'; // 'waiting', 'playing', 'gameover', 'initial', 'scorescreen'
let currentLevel = 1;
let inputCooldown = false;
let timeoutId = null;
let timerInterval = null;
let timerRemaining = 5000;
let playerName = '';
let playerId = '';
let playerCountry = 'USA';
let gameStartTime = 0;


// PLAYER ID & COUNTRY SETUP
function generatePlayerId() {
    let id = localStorage.getItem('nmgPlayerId');
    if (!id) {
        id = 'p_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
        localStorage.setItem('nmgPlayerId', id);
    }
    return id;
}

async function detectCountry() {
    try {
        let cachedCountry = localStorage.getItem('nmgCountry');
        if (cachedCountry) {
            playerCountry = cachedCountry;
            return;
        }
        
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
            const data = await response.json();
            playerCountry = data.country_code || 'USA';
            localStorage.setItem('nmgCountry', playerCountry);
        }
    } catch (e) {
        playerCountry = 'USA';
    }
}


// FIREBASE LEADERBOARD FUNCTIONS
const LEADERBOARD_PAGE_SIZE = 20;
let currentPageStart = null;

async function submitGlobalScore() {
    if (score <= 0 || !playerName) return;
    
    try {
        const scoresRef = collection(db, 'leaderboard');
        
        const q = query(
            scoresRef,
            where('playerId', '==', playerId),
            where('name', '==', playerName)
        );
        const existing = await getDocs(q);
        
        if (!existing.empty) {
            let isUpdate = false;
            existing.forEach(docSnap => {
                if (docSnap.data().score < score) {
                    updateDoc(doc(db, 'leaderboard', docSnap.id), {
                        score: score,
                        level: currentLevel,
                        country: playerCountry,
                        timestamp: serverTimestamp()
                    });
                    isUpdate = true;
                }
            });
            if (isUpdate) console.log('Score updated!');
        } else {
            await addDoc(collection(db, 'leaderboard'), {
                name: playerName,
                score: score,
                level: currentLevel,
                country: playerCountry,
                playerId: playerId,
                timestamp: serverTimestamp()
            });
            console.log('New score submitted!');
        }
    } catch (e) {
        console.error('Error submitting score:', e);
    }
}

async function fetchLeaderboardPage(forward = true) {
    try {
        const scoresRef = collection(db, 'leaderboard');
        let q;
        
        if (forward && !currentPageStart) {
            q = query(scoresRef, orderBy('score', 'desc'), limit(LEADERBOARD_PAGE_SIZE));
        } else if (forward && currentPageStart) {
            q = query(scoresRef, orderBy('score', 'desc'), startAfter(currentPageStart), limit(LEADERBOARD_PAGE_SIZE));
        } else {
            currentPageStart = null;
            q = query(scoresRef, orderBy('score', 'desc'), limit(LEADERBOARD_PAGE_SIZE));
        }
        
        const snapshot = await getDocs(q);
        const scores = [];
        
        snapshot.forEach(doc => {
            scores.push({ id: doc.id, ...doc.data() });
        });
        
        if (scores.length > 0) {
            currentPageStart = scores[scores.length - 1].score;
        }
        
        return scores;
    } catch (e) {
        console.error('Error fetching leaderboard:', e);
        return [];
    }
}

function renderGlobalLeaderboard(scores, currentPlayerScore) {
    let html = '<h2>Global Leaderboard</h2>';
    
    if (scores.length === 0) {
        html += '<p>No scores yet. Be the first!</p>';
    } else {
        html += '<div class="lb-grid lb-header"><span class="lb-rank">#</span><span class="lb-name">Name</span><span class="lb-score">Score</span><span class="lb-level">Level</span><span class="lb-country">Country</span></div>';
        scores.forEach((entry, index) => {
            const isNewHighScore = entry.name === playerName && entry.score === currentPlayerScore && currentPlayerScore > 0;
            const isCurrentPlayer = entry.name === playerName && !isNewHighScore;
            
            let entryClass = 'lb-entry';
            if (isNewHighScore) {
                entryClass += ' new-high';
            } else if (isCurrentPlayer) {
                entryClass += ' current-player';
            }
            
            const rank = index + 1;
            html += `<div class="${entryClass}">`;
            html += `<span class="lb-rank">${rank}</span>`;
            html += `<span class="lb-name">${entry.name}</span>`;
            html += `<span class="lb-score">${entry.score}</span>`;
            html += `<span class="lb-level">Lv ${entry.level}</span>`;
            html += `<span class="lb-country">${entry.country}</span>`;
            html += '</div>';
        });
    }
    
    html += '<div class="leaderboard-nav"><button id="lb-prev" class="lb-btn">&#8592; Prev</button><button id="lb-next" class="lb-btn">Next &#8594;</button></div>';
    html += '<p class="lb-close">Press <strong>Enter</strong> or <strong>Esc</strong> to close</p>';
    
    return html;
}


// DOM Elements
let numberText = document.getElementById('number-text');
let scoreValue = document.getElementById('score-value');
let levelValue = document.getElementById('level-value');
let timerValue = document.getElementById('timer-value');
let timerDisplay = document.getElementById('timer-display');
let userAnswer = document.getElementById('user-answer');
let inputField = document.getElementById('answer-input');
let message = document.getElementById('message');
let gameOverScreen = document.querySelector('.game-over');
let menuIcon = document.getElementById('menu-icon');
let slideMenu = document.getElementById('slide-menu');
let themeCheckbox = document.getElementById('theme-checkbox');
let globalLeaderboard = document.getElementById('global-leaderboard');
let changePlayerBtn = document.getElementById('change-player-btn');
let viewLeaderboardBtn = document.getElementById('view-leaderboard-btn');
let startScreen = document.getElementById('start-screen');
let nameInput = document.getElementById('name-input');

// Animation helper functions
function animateIncrement(element, newValue) {
    element.classList.add('anim-out');
    setTimeout(() => {
        element.innerText = newValue;
        element.classList.remove('anim-out');
        element.classList.add('anim-in');
        setTimeout(() => {
            element.classList.remove('anim-in');
        }, 150);
    }, 120);
}

function animateScore(newScore) {
    animateIncrement(scoreValue, newScore);
}

function animateLevel(newLevel) {
    animateIncrement(levelValue, newLevel);
}

// Timer functions
function formatTime(ms) {
    let seconds = Math.floor(ms / 1000);
    let hundredths = Math.floor((ms % 1000) / 10);
    return `${seconds.toString().padStart(2, '0')}:${hundredths.toString().padStart(2, '0')}`;
}

function interpolateColor(percent) {
    let grayR = 138, grayG = 143, grayB = 152;
    let redR = 244, redG = 67, redB = 54;
    
    let r = Math.round(grayR + (redR - grayR) * percent);
    let g = Math.round(grayG + (redG - grayG) * percent);
    let b = Math.round(grayB + (redB - grayB) * percent);
    
    return `rgb(${r}, ${g}, ${b})`;
}

function startTimer() {
    timerRemaining = 5000;
    timerValue.innerText = formatTime(timerRemaining);
    timerValue.style.color = '';
    
    timerInterval = setInterval(() => {
        timerRemaining -= 10;
        timerValue.innerText = formatTime(timerRemaining);
        
        let msIntoSecond = timerRemaining % 1000;
        let distanceFromWhole = Math.abs(msIntoSecond);
        
        if (distanceFromWhole <= 150 && timerRemaining > 0) {
            let intensity = 1 - (distanceFromWhole / 150);
            timerValue.style.color = interpolateColor(intensity);
        } else {
            timerValue.style.color = '';
        }
    }, 10);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetTimer() {
    stopTimer();
    timerRemaining = 5000;
    timerValue.innerText = "05:00";
    timerValue.style.color = '';
}

// Theme Toggle
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        themeCheckbox.checked = false;
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeCheckbox.checked = true;
    }
    
    playerName = localStorage.getItem('nmgPlayerName') || '';
    playerId = generatePlayerId();
    detectCountry();
    
    if (playerName) {
        startScreen.classList.add('hidden');
        startGame();
    } else {
        nameInput.focus();
    }
}

themeCheckbox.addEventListener('change', function () {
    if (this.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
    }
});

// Event Listeners
document.addEventListener('keydown', handleKey);

userAnswer.addEventListener('input', function() {
    this.value = this.value.replace(/[^0-9]/g, '');
});

menuIcon.addEventListener('click', () => {
    const isOpen = slideMenu.classList.toggle('open');
    menuIcon.classList.toggle('open');
    menuIcon.setAttribute('aria-expanded', isOpen);
    slideMenu.setAttribute('aria-hidden', !isOpen);
    menuIcon.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
});

nameInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        if (inputCooldown) return;
        
        let enteredName = nameInput.value.trim().toUpperCase();
        enteredName = enteredName.replace(/[^A-Z0-9]/g, '').slice(0, 10);
        
        if (enteredName === '') {
            return;
        }
        
        playerName = enteredName;
        localStorage.setItem('nmgPlayerName', playerName);
        
        startScreen.classList.add('hidden');
        startGame();
    }
});

nameInput.addEventListener('input', function() {
    let value = this.value.toUpperCase();
    value = value.replace(/[^A-Z0-9]/g, '');
    if (value.length > 10) {
        value = value.slice(0, 10);
    }
    this.value = value;
});

changePlayerBtn.addEventListener('click', () => {
    slideMenu.classList.remove('open');
    menuIcon.classList.remove('open');
    menuIcon.setAttribute('aria-expanded', false);
    slideMenu.setAttribute('aria-hidden', true);
    menuIcon.setAttribute('aria-label', 'Open menu');
    
    playerName = '';
    localStorage.removeItem('nmgPlayerName');
    
    startScreen.classList.remove('hidden');
    nameInput.value = '';
    nameInput.focus();
});

viewLeaderboardBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    slideMenu.classList.remove('open');
    menuIcon.classList.remove('open');
    menuIcon.setAttribute('aria-expanded', false);
    slideMenu.setAttribute('aria-hidden', true);
    menuIcon.setAttribute('aria-label', 'Open menu');
    
    currentPageStart = null;
    const scores = await fetchLeaderboardPage(true);
    globalLeaderboard.innerHTML = renderGlobalLeaderboard(scores, score);
    globalLeaderboard.style.visibility = "visible";
    
    document.getElementById('lb-prev').addEventListener('click', async () => {
        currentPageStart = null;
        const prevScores = await fetchLeaderboardPage(false);
        globalLeaderboard.innerHTML = renderGlobalLeaderboard(prevScores, score);
        setupLeaderboardNav();
    });
    
    document.getElementById('lb-next').addEventListener('click', async () => {
        const nextScores = await fetchLeaderboardPage(true);
        globalLeaderboard.innerHTML = renderGlobalLeaderboard(nextScores, score);
        setupLeaderboardNav();
    });
    
    gameState = 'scorescreen';
});

function setupLeaderboardNav() {
    document.getElementById('lb-prev').addEventListener('click', async () => {
        currentPageStart = null;
        const prevScores = await fetchLeaderboardPage(false);
        globalLeaderboard.innerHTML = renderGlobalLeaderboard(prevScores, score);
        setupLeaderboardNav();
    });
    
    document.getElementById('lb-next').addEventListener('click', async () => {
        const nextScores = await fetchLeaderboardPage(true);
        globalLeaderboard.innerHTML = renderGlobalLeaderboard(nextScores, score);
        setupLeaderboardNav();
    });
}

function handleKey(e) {
    if (e.key === 'Escape' && globalLeaderboard.style.visibility === 'visible') {
        globalLeaderboard.style.visibility = "hidden";
        gameState = 'initial';
        message.innerHTML = 'Hit <strong>Enter</strong> to Start<br><br>You have 5 seconds to answer.';
        message.classList.add('initial-message');
        return;
    }
    
    if (e.key === 'Enter') {
        if (inputCooldown) return;

        if (gameState === 'initial') {
            inputCooldown = true;
            
            gameOverScreen.style.visibility = "hidden";
            gameState = 'playing';
            score = 0;
            currentLevel = 1;
            scoreValue.innerText = "0";
            levelValue.innerText = "1";
            message.classList.remove('initial-message');
            userAnswer.value = '';
            userAnswer.disabled = false;
            userAnswer.focus();
            newRound();
            setTimeout(() => { inputCooldown = false; }, 100);
            
        } else if (gameState === 'scorescreen') {
            inputCooldown = true;
            globalLeaderboard.style.visibility = "hidden";
            gameState = 'playing';
            score = 0;
            currentLevel = 1;
            scoreValue.innerText = "0";
            levelValue.innerText = "1";
            userAnswer.value = '';
            userAnswer.disabled = true;
            message.classList.remove('initial-message');
            setTimeout(() => { inputCooldown = false; }, 100);
            newRound();
            
        } else if (gameState === 'playing') {
            inputCooldown = true;
            userAnswer.disabled = true;

            if (userAnswer.value === '') {
                userAnswer.disabled = false;
                userAnswer.focus();
                inputCooldown = false;
                return;
            }

            clearTimeout(timeoutId);
            stopTimer();

            if (userAnswer.value == currentRGN) {
                userAnswer.style.borderColor = '#4caf50';
                setTimeout(() => {
                    userAnswer.style.borderColor = '';
                }, 500);
                score += 1;
                animateScore(score);
                userAnswer.value = '';
                if (score % 4 === 0) {
                    currentLevel += 1;
                    animateLevel(currentLevel);
                }
                newRound();
            } else {
                gameState = 'gameover';
                endGame();
                setTimeout(() => { inputCooldown = false; }, 1500);
            }
        }
    }
}

// FORMAT NUMBER WITH SPACES
function formatNumberWithSpaces(num) {
    let str = num.toString();
    let len = str.length;
    
    if (len === 6 || len === 8 || len === 10) {
        let half = len / 2;
        return str.slice(0, half) + ' ' + str.slice(half);
    } else if (len === 9) {
        return str.slice(0, 3) + ' ' + str.slice(3, 6) + ' ' + str.slice(6);
    }
    
    return str;
}

function rng() {
    let digitCount;
    
    if (currentLevel >= 3) {
        let maxDigits = currentLevel + 2;
        digitCount = Math.floor(Math.random() * (maxDigits - 2 + 1)) + 2;
    } else {
        digitCount = currentLevel + 2;
    }
    
    let min = Math.pow(10, digitCount - 1);
    let max = Math.pow(10, digitCount) - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


function startGame() {
    gameState = "initial";
    score = 0;
    currentLevel = 1;
    scoreValue.innerText = "0";
    levelValue.innerText = "1";
    resetTimer();
    numberText.style.visibility = "hidden";
    gameOverScreen.style.visibility = "hidden";
    globalLeaderboard.style.visibility = "hidden";
    userAnswer.value = '';
    userAnswer.disabled = true;
    userAnswer.focus();
    
    message.innerHTML = 'Hit <strong>Enter</strong> to Start<br><br><span class="timeout-hint">You have 5 seconds to answer.</span>';
    message.classList.add('initial-message');
}

function newRound() {
    userAnswer.disabled = true;
    currentRGN = rng();
    numberText.innerText = formatNumberWithSpaces(currentRGN);
    message.style.visibility = "hidden";
    gameStartTime = Date.now();

    let digitCount = currentRGN.toString().length;
    let flashDuration = 1000;

    if (currentLevel >= 3) {
        if (digitCount === 2) {
            flashDuration = 250;
        } else if (digitCount === 3) {
            flashDuration = 500;
        }
    }

    setTimeout(() => {
        numberText.style.visibility = "visible";
    }, 1000);

    setTimeout(() => {
        numberText.style.visibility = "hidden";
        userAnswer.disabled = false;
        userAnswer.focus();
        inputCooldown = false;
        message.style.visibility = "visible";
        message.innerHTML = "Enter your answer";
        startTimer();
        
        timeoutId = setTimeout(() => {
            gameState = 'gameover';
            endGame(true);
            setTimeout(() => { inputCooldown = false; }, 1500);
        }, 5000);
    }, 1000 + flashDuration);

}


function correctAnswer() {
    console.log('You got it right!')
    score += 1;
    scoreValue.innerText = score;
    console.log("Your current score is:", score);
    userAnswer.value = ''; // Clear input
    newRound();
}

function endGame(timedOut = false) {
    console.log("Game Over! Start again by hitting 'Enter'");
    userAnswer.value = '';
    userAnswer.disabled = true;
    clearTimeout(timeoutId);
    stopTimer();
    resetTimer();
    
    if (score > 0) {
        submitGlobalScore();
    }
    
    let timedOutHtml = timedOut ? `<p class="timed-out">Timed Out</p>` : '';
    
    gameOverScreen.innerHTML = `<h1>Game Over</h1>${timedOutHtml}<p class="final-score">Score: ${score}</p>`;
    gameOverScreen.style.visibility = "visible";
    message.style.visibility = "hidden";
    
    setTimeout(async () => {
        gameOverScreen.style.visibility = "hidden";
        
        currentPageStart = null;
        const scores = await fetchLeaderboardPage(true);
        globalLeaderboard.innerHTML = renderGlobalLeaderboard(scores, score);
        globalLeaderboard.style.visibility = "visible";
        setupLeaderboardNav();
        
        gameState = 'scorescreen';
        message.style.visibility = "visible";
        message.innerHTML = "Hit <strong>Enter</strong> to Restart";
    }, 2000);
}


// MAIN... Calling all functions

initTheme();
startGame()