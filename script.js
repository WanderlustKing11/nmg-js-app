
// GLOBAL VARIABLES
let score = 0
let currentRGN = 0;
let gameState = 'waiting'; // 'waiting', 'playing', 'gameover'
let currentLevel = 1;


// DOM Elements
let numberText = document.getElementById('number-text');
let scoreValue = document.getElementById('score-value');
let userAnswer = document.getElementById('user-answer');
let inputField = document.getElementById('answer-input');
let message = document.getElementById('message');
let gameOverScreen = document.querySelector('.game-over');
// Event Listeners
document.addEventListener('keydown', handleKey);

function handleKey(e) {
    if (e.key === 'Enter') {
        if (gameState === 'waiting' || gameState === 'gameover') {
            gameOverScreen.style.visibility = "hidden";
            gameState = 'playing';
            score = 0;
            currentLevel = 1;
            scoreValue.innerText = "0";
            newRound();
        } else if (gameState === 'playing') {
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
    gameState = "waiting";
    score = 0;
    currentLevel = 1;
    scoreValue.innerText = "0";
    numberText.style.visibility = "hidden";
    gameOverScreen.style.visibility = "hidden";
    userAnswer.disabled = true;
    message.innerHTML = "Hit <strong>Enter</strong> to Start";
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
    gameOverScreen.style.visibility = "visible";
    message.style.visibility = "visible";
    message.innerHTML = "Hit <strong>Enter</strong> to Restart";
}


// MAIN... Calling all functions
// const rng = generateRandomNumber();
// console.log("Current random number generated:", rng);
startGame()