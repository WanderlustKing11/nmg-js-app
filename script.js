
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

// Event Listeners
document.addEventListener('keydown', handleKey);
menuIcon.addEventListener('click', () => {
    slideMenu.classList.toggle('open');
    menuIcon.classList.toggle('open');
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
                if (score % 5 === 0) {
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

function rng() {
    let min = Math.pow(10, currentLevel + 1);
    let max = min * 9;
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
    numberText.innerText = currentRGN;
    message.style.visibility = "hidden";

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
    }, 2000);

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
// const rng = generateRandomNumber();
// console.log("Current random number generated:", rng);
startGame()