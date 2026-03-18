
// GLOBAL VARIABLES
let score = 0
let currentRGN = 0;
let gameState = 'waiting'; // 'waiting', 'playing', 'gameover', 'initial', 'scorescreen'
let currentLevel = 1;
let inputCooldown = false;
let timeoutId = null;
let playerName = '';
let isNewHighScore = false;


// DOM Elements
let numberText = document.getElementById('number-text');
let scoreValue = document.getElementById('score-value');
let levelValue = document.getElementById('level-value');
let userAnswer = document.getElementById('user-answer');
let inputField = document.getElementById('answer-input');
let message = document.getElementById('message');
let gameOverScreen = document.querySelector('.game-over');
let menuIcon = document.getElementById('menu-icon');
let slideMenu = document.getElementById('slide-menu');
let themeCheckbox = document.getElementById('theme-checkbox');
let highScoreBoard = document.getElementById('high-score-board');
let changePlayerBtn = document.getElementById('change-player-btn');

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
menuIcon.addEventListener('click', () => {
    const isOpen = slideMenu.classList.toggle('open');
    menuIcon.classList.toggle('open');
    menuIcon.setAttribute('aria-expanded', isOpen);
    slideMenu.setAttribute('aria-hidden', !isOpen);
    menuIcon.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
});

userAnswer.addEventListener('input', function() {
    if (gameState === 'initial') {
        message.innerHTML = 'Hit <strong>Enter</strong> to Start<br><br>You have 5 seconds to answer.';
    }
});

changePlayerBtn.addEventListener('click', () => {
    slideMenu.classList.remove('open');
    menuIcon.classList.remove('open');
    menuIcon.setAttribute('aria-expanded', false);
    slideMenu.setAttribute('aria-hidden', true);
    menuIcon.setAttribute('aria-label', 'Open menu');
    
    playerName = '';
    localStorage.removeItem('nmgPlayerName');
    
    gameState = 'initial';
    score = 0;
    currentLevel = 1;
    scoreValue.innerText = '0';
    levelValue.innerText = '1';
    numberText.style.visibility = 'hidden';
    gameOverScreen.style.visibility = 'hidden';
    highScoreBoard.style.visibility = 'hidden';
    userAnswer.value = '';
    userAnswer.disabled = false;
    userAnswer.focus();
    message.innerHTML = 'Enter your name<br><br>Hit <strong>Enter</strong> to Start<br><br>You have 5 seconds to answer.';
    message.classList.add('initial-message');
});

function handleKey(e) {
    if (e.key === 'Enter') {
        if (inputCooldown) return;

        if (gameState === 'initial') {
            inputCooldown = true;
            
            if (playerName && playerName.trim() !== '') {
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
                inputCooldown = false;
                newRound();
            } else {
                let enteredName = userAnswer.value.trim().toUpperCase();
                enteredName = enteredName.replace(/[^A-Z0-9]/g, '').slice(0, 10);
                
                if (enteredName === '') {
                    inputCooldown = false;
                    return;
                }
                
                playerName = enteredName;
                localStorage.setItem('nmgPlayerName', playerName);
                userAnswer.value = '';
                
                gameOverScreen.style.visibility = "hidden";
                gameState = 'playing';
                score = 0;
                currentLevel = 1;
                scoreValue.innerText = "0";
                levelValue.innerText = "1";
                message.classList.remove('initial-message');
                newRound();
            }
            setTimeout(() => { inputCooldown = false; }, 100);
            
        } else if (gameState === 'scorescreen') {
            inputCooldown = true;
            highScoreBoard.style.visibility = "hidden";
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

            if (userAnswer.value == currentRGN) {
                userAnswer.style.borderColor = '#4caf50';
                setTimeout(() => {
                    userAnswer.style.borderColor = '';
                }, 500);
                score += 1;
                scoreValue.innerText = score;
                userAnswer.value = '';
                if (score % 4 === 0) {
                    currentLevel += 1;
                    levelValue.innerText = currentLevel;
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

// HIGH SCORE FUNCTIONS
function getHighScores() {
    let scores = localStorage.getItem('nmgHighScores');
    return scores ? JSON.parse(scores) : [];
}

function saveHighScores(scores) {
    localStorage.setItem('nmgHighScores', JSON.stringify(scores));
}

function isHighScore(newScore, playerName) {
    let scores = getHighScores();
    let existingPlayer = scores.find(s => s.name === playerName);
    
    if (existingPlayer) {
        return newScore > existingPlayer.score;
    }
    
    if (scores.length < 10) return true;
    return newScore > scores[scores.length - 1].score;
}

function saveHighScore(name, newScore, level) {
    let scores = getHighScores();
    let upperName = name.toUpperCase();
    let existingIndex = scores.findIndex(s => s.name === upperName);
    
    if (existingIndex !== -1) {
        if (newScore > scores[existingIndex].score) {
            scores[existingIndex] = {
                name: upperName,
                score: newScore,
                level: level,
                date: Date.now()
            };
            scores.sort((a, b) => b.score - a.score);
            saveHighScores(scores);
        }
        return scores;
    }
    
    let newEntry = {
        name: upperName,
        score: newScore,
        level: level,
        date: Date.now()
    };
    
    scores.push(newEntry);
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 10);
    saveHighScores(scores);
    return scores;
}

function renderScoreBoard(currentPlayerScore = 0, currentPlayerLevel = 1) {
    let scores = getHighScores();
    let maxDisplay = Math.min(scores.length, 10);
    let scoreHtml = '';
    
    for (let i = 0; i < maxDisplay; i++) {
        let score = scores[i];
        let isCurrentPlayer = score.score === currentPlayerScore && currentPlayerScore > 0;
        let currentClass = isCurrentPlayer ? 'current-score' : '';
        scoreHtml += `<p class="${currentClass}">${i + 1}. ${score.name} - ${score.score} (Lv ${score.level})</p>`;
    }
    
    return scoreHtml;
}

function getRainbowText(text) {
    let colors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3'];
    let result = '';
    for (let i = 0; i < text.length; i++) {
        result += `<span style="color: ${colors[i % colors.length]}">${text[i]}</span>`;
    }
    return result;
}

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
    numberText.style.visibility = "hidden";
    gameOverScreen.style.visibility = "hidden";
    highScoreBoard.style.visibility = "hidden";
    userAnswer.value = playerName || '';
    userAnswer.disabled = false;
    userAnswer.focus();
    
    message.innerHTML = 'Hit <strong>Enter</strong> to Start<br><br>You have 5 seconds to answer.';
    message.classList.add('initial-message');
}

function newRound() {
    userAnswer.disabled = true;
    currentRGN = rng();
    numberText.innerText = formatNumberWithSpaces(currentRGN);
    message.style.visibility = "hidden";

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
    
    isNewHighScore = isHighScore(score, playerName);
    
    if (isNewHighScore && score > 0) {
        saveHighScore(playerName, score, currentLevel);
    }
    
    let timedOutHtml = timedOut ? `<p class="timed-out">Timed Out</p>` : '';
    let scoreLabel = isNewHighScore && score > 0 ? 
        `<p class="new-high-score">${getRainbowText('New High Score!')}</p><p class="final-score">Score: ${score}</p>` : 
        `<p class="final-score">Score: ${score}</p>`;
    
    gameOverScreen.innerHTML = `<h1>Game Over</h1>${timedOutHtml}${scoreLabel}`;
    gameOverScreen.style.visibility = "visible";
    message.style.visibility = "hidden";
    
    setTimeout(() => {
        gameState = 'scorescreen';
        gameOverScreen.style.visibility = "hidden";
        
        let scoresHtml = renderScoreBoard(score, currentLevel);
        highScoreBoard.innerHTML = `<h2>High Scores</h2>${scoresHtml}`;
        highScoreBoard.style.visibility = "visible";
        message.style.visibility = "visible";
        message.innerHTML = "Hit <strong>Enter</strong> to Restart";
    }, 2000);
}


// MAIN... Calling all functions

initTheme();
startGame()