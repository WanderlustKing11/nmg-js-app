
// GLOBAL VARIABLES
let score = 0
let currentRGN = 0;
let gameState = 'waiting'; // 'waiting', 'playing', 'gameover', 'initial'
let currentLevel = 1;
let inputCooldown = false;


// DOM Elements
let numberText = document.getElementById('number-text');
let scoreValue = document.getElementById('score-value');
let userAnswer = document.getElementById('user-answer');
let inputField = document.getElementById('answer-input');
let message = document.getElementById('message');
let gameOverScreen = document.querySelector('.game-over');
let menuIcon = document.getElementById('menu-icon');
let slideMenu = document.getElementById('slide-menu');
let themeCheckbox = document.getElementById('theme-checkbox');

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

function handleKey(e) {
    if (e.key === 'Enter') {
        if (inputCooldown) return;

        if (gameState === 'initial' || gameState === 'waiting' || gameState === 'gameover') {
            inputCooldown = true;
            gameOverScreen.style.visibility = "hidden";
            gameState = 'playing';
            score = 0;
            currentLevel = 1;
            scoreValue.innerText = "0";
            message.classList.remove('initial-message');
            newRound();
            setTimeout(() => { inputCooldown = false; }, 100);
        } else if (gameState === 'playing') {
            inputCooldown = true;
            userAnswer.disabled = true;

            if (userAnswer.value === '') {
                userAnswer.disabled = false;
                userAnswer.focus();
                inputCooldown = false;
                return;
            }

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
    numberText.style.visibility = "hidden";
    gameOverScreen.style.visibility = "hidden";
    userAnswer.disabled = true;
    message.innerHTML = "Hit <strong>Enter</strong> to Start";
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

function endGame() {
    console.log("Game Over! Start again by hitting 'Enter'");
    userAnswer.value = '';
    userAnswer.disabled = true;
    gameOverScreen.innerHTML = `<h1>Game Over</h1><p class="final-score">Score: ${score}</p>`;
    gameOverScreen.style.visibility = "visible";
    message.style.visibility = "visible";
    message.innerHTML = "Hit <strong>Enter</strong> to Restart";
}


// MAIN... Calling all functions

initTheme();
startGame()