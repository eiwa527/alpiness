const wordRushWords = [
    "code", "swift", "level", "rally", "focus", "arcade", "combo",
    "typing", "streak", "boost", "react", "pulse", "motion", "signal",
    "dash", "driven", "vivid", "tempo", "glide", "flare", "sharp",
    "rapid", "storm", "quest", "pixel", "spark"
];

const wordleWords = {
    easy: [
        "code", "game", "fast", "type", "play", "dash", "word", "zone",
        "gear", "grid", "glow", "jump", "pace", "quiz", "rank", "rush",
        "spin", "task", "wave", "zoom", "clue", "flip", "form", "sync"
    ],
    medium: [
        "speed", "score", "focus", "glide", "spark", "swift", "shine", "storm",
        "track", "quest", "pulse", "skill", "level", "flash", "brain", "chain",
        "dream", "start", "learn", "pixel", "clock", "match", "boost", "react"
    ],
    hard: [
        "arcade", "coding", "planet", "stream", "flight", "puzzle", "bright", "charge",
        "silver", "search", "rocket", "target", "layout", "cursor", "rhythm", "memory",
        "jungle", "golden", "meteor", "signal", "thread", "object", "frozen", "little"
    ]
};

const scrambleWords = [
    { word: "javascript", hint: "A very popular language for the web." },
    { word: "keyboard", hint: "You use this hardware to play every game here." },
    { word: "function", hint: "A reusable block of code." },
    { word: "browser", hint: "This opens websites and web apps." },
    { word: "developer", hint: "A person who builds software." },
    { word: "algorithm", hint: "A step-by-step problem-solving method." },
    { word: "interface", hint: "The visible layer people interact with." },
    { word: "challenge", hint: "A task that tests your skill." },
    { word: "practice", hint: "Repeated training to improve performance." },
    { word: "reaction", hint: "How quickly you respond to a signal." }
];

const sequenceSymbols = ["A", "S", "D", "F", "J", "K", "L"];
const colorRounds = [
    { word: "cyan", color: "#22d3ee", options: ["cyan", "gold", "green", "rose"] },
    { word: "gold", color: "#f59e0b", options: ["cyan", "gold", "purple", "blue"] },
    { word: "green", color: "#22c55e", options: ["green", "pink", "amber", "white"] },
    { word: "rose", color: "#fb7185", options: ["rose", "teal", "gray", "lime"] },
    { word: "violet", color: "#a78bfa", options: ["violet", "orange", "red", "aqua"] }
];
const oddOneOutRounds = [
    { prompt: "Find the odd one out.", options: ["keyboard", "monitor", "browser", "mouse"], answer: "browser" },
    { prompt: "Find the odd one out.", options: ["speed", "accuracy", "rhythm", "banana"], answer: "banana" },
    { prompt: "Find the odd one out.", options: ["array", "function", "loop", "backpack"], answer: "backpack" },
    { prompt: "Find the odd one out.", options: ["piano", "violin", "drum", "cursor"], answer: "cursor" },
    { prompt: "Find the odd one out.", options: ["html", "css", "javascript", "notebook"], answer: "notebook" }
];
const flashPhrases = [
    "Fast hands come from calm and consistent practice.",
    "Accuracy builds trust before speed builds style.",
    "Every clean run teaches more than a rushed mistake.",
    "A sharp typist listens to rhythm as much as speed.",
    "Good reactions start with focus and control."
];
const statsKey = "typingGameHubStats";
const leaderboardFallback = [
    { name: "Word Rush", score: 120, note: "Starter benchmark" },
    { name: "Quick Tap", score: 98, note: "Reaction benchmark" },
    { name: "Wordle", score: 92, note: "Logic benchmark" }
];

let rushTimer = null;
let quickTapTimeout = null;
let quickTapStart = 0;
let memoryLock = false;
let sequenceTimer = null;
let currentDifficulty = "medium";
let currentGameStarter = null;

function readStats() {
    try {
        return (
            JSON.parse(localStorage.getItem(statsKey)) || {
                bestWpm: 0,
                gamesWon: 0,
                streak: 0,
                bestStreak: 0,
                leaderboard: []
            }
        );
    } catch {
        return {
            bestWpm: 0,
            gamesWon: 0,
            streak: 0,
            bestStreak: 0,
            leaderboard: []
        };
    }
}

function writeStats(next) {
    localStorage.setItem(statsKey, JSON.stringify(next));
}

function pickRandom(items) {
    return items[Math.floor(Math.random() * items.length)];
}

function syncGameStats() {
    const stats = readStats();
    document.getElementById("gamesWon").innerText = stats.gamesWon || 0;
    document.getElementById("bestStreak").innerText = stats.bestStreak || 0;
    renderLeaderboard(stats.leaderboard || []);
}

function renderLeaderboard(entries) {
    const leaderboard = document.getElementById("leaderboardList");

    if (!leaderboard) {
        return;
    }

    const rows = entries.length > 0 ? entries : leaderboardFallback;

    leaderboard.innerHTML = rows
        .slice(0, 5)
        .map((entry, index) => `
            <div class="leaderboard-row">
                <div class="leaderboard-rank">#${index + 1}</div>
                <div class="leaderboard-copy">
                    <strong>${entry.name}</strong>
                    <span>${entry.note}</span>
                </div>
                <div class="leaderboard-score">${entry.score}</div>
            </div>
        `)
        .join("");
}

function updateLeaderboard(gameName, score, note) {
    const stats = readStats();
    const leaderboard = Array.isArray(stats.leaderboard) ? stats.leaderboard : [];
    const nextEntry = { name: gameName, score, note };

    leaderboard.push(nextEntry);
    leaderboard.sort((a, b) => b.score - a.score);
    stats.leaderboard = leaderboard.slice(0, 5);

    writeStats(stats);
    syncGameStats();
}

function registerWin(gameName, score = 100, note = "Round cleared", streakIncrease = true) {
    const stats = readStats();

    stats.gamesWon = (stats.gamesWon || 0) + 1;
    stats.streak = streakIncrease ? (stats.streak || 0) + 1 : stats.streak || 0;
    stats.bestStreak = Math.max(stats.bestStreak || 0, stats.streak || 0);

    writeStats(stats);
    syncGameStats();
    updateLeaderboard(gameName, score, note);
}

function breakStreak() {
    const stats = readStats();
    stats.streak = 0;
    writeStats(stats);
    syncGameStats();
}

function setGameStatus(message) {
    document.getElementById("gameStatus").innerText = message;
}

function setDifficulty(level) {
    currentDifficulty = level;
    setGameStatus(`Difficulty set to ${level}. Pick a game or retry the current one.`);
}

function setCurrentGame(starter) {
    currentGameStarter = starter;
}

function retryControls() {
    return `
        <div class="control-row">
            <button class="secondary-btn retry-btn" onclick="retryCurrentGame()">Retry</button>
        </div>
    `;
}

function retryCurrentGame() {
    if (typeof currentGameStarter === "function") {
        currentGameStarter();
    }
}

function clearGameTimers() {
    clearInterval(rushTimer);
    clearTimeout(quickTapTimeout);
    clearTimeout(sequenceTimer);

    rushTimer = null;
    quickTapTimeout = null;
    sequenceTimer = null;
    memoryLock = false;
}

function startWordRush() {
    setCurrentGame(startWordRush);
    clearGameTimers();

    let score = 0;
    let streak = 0;
    let timeLeft = currentDifficulty === "easy" ? 30 : currentDifficulty === "hard" ? 18 : 25;
    let currentWord = pickRandom(wordRushWords);
    const goal = currentDifficulty === "easy" ? 10 : currentDifficulty === "hard" ? 14 : 12;

    document.getElementById("gameArea").innerHTML = `
        <div class="featured-game">
            <div class="tag-row">
                <span class="tag">Countdown</span>
                <span class="tag">Expanded word bank</span>
            </div>
            <h3>Word Rush</h3>
            <div class="rush-word" id="rushWord">${currentWord}</div>
            <div class="meter"><div class="meter-fill" id="rushMeter"></div></div>
            <input id="wrInput" placeholder="Type the word exactly">
            <div class="scoreboard">
                <div class="score-card"><span>Score</span><strong id="rushScore">0</strong></div>
                <div class="score-card"><span>Streak</span><strong id="rushStreak">0</strong></div>
                <div class="score-card"><span>Time Left</span><strong id="rushTime">${timeLeft}s</strong></div>
                <div class="score-card"><span>Goal</span><strong>${goal}+</strong></div>
            </div>
            ${retryControls()}
        </div>
    `;

    const input = document.getElementById("wrInput");
    input.focus();

    setGameStatus(
        "The word pool is larger now, so expect less repetition and faster reading pressure."
    );

    rushTimer = setInterval(() => {
        timeLeft -= 1;
        document.getElementById("rushTime").innerText = `${timeLeft}s`;
        document.getElementById("rushMeter").style.width = `${(timeLeft / (currentDifficulty === "easy" ? 30 : currentDifficulty === "hard" ? 18 : 25)) * 100}%`;

        if (timeLeft > 0) {
            return;
        }

        clearInterval(rushTimer);
        input.disabled = true;

        if (score >= goal) {
            registerWin("Word Rush", score * 10, `${score} points in ${currentDifficulty}`);
            setGameStatus(`Word Rush cleared with ${score} points. Great pace.`);
        } else {
            breakStreak();
            setGameStatus(`Time up. You scored ${score}. Reach ${goal} to win the round.`);
        }
    }, 1000);

    input.addEventListener("input", function () {
        if (this.value.toLowerCase() !== currentWord.toLowerCase()) {
            return;
        }

        streak += 1;
        score += 1 + Math.floor(streak / 3);
        currentWord = pickRandom(wordRushWords);

        this.value = "";
        document.getElementById("rushWord").innerText = currentWord;
        document.getElementById("rushScore").innerText = score;
        document.getElementById("rushStreak").innerText = streak;
    });
}

function startWordle() {
    setCurrentGame(startWordle);
    clearGameTimers();

    const wordLength = currentDifficulty === "easy" ? 4 : currentDifficulty === "hard" ? 6 : 5;
    const word = pickRandom(wordleWords[currentDifficulty]);
    let attempts = 0;
    const maxAttempts = currentDifficulty === "easy" ? 7 : currentDifficulty === "hard" ? 5 : 6;

    document.getElementById("gameArea").innerHTML = `
        <div class="featured-game">
            <div class="tag-row">
                <span class="tag">${wordLength} letters</span>
                <span class="tag">${maxAttempts} attempts</span>
            </div>
            <h3>Wordle</h3>
            <p class="helper">
                Green is correct. Gold means the letter is in the word but in another spot.
            </p>
            <input id="guessInput" maxlength="${wordLength}" placeholder="Enter a ${wordLength}-letter word">
            <div id="gridWrap"></div>
            <div class="typing-status" id="wordleStatus">Guess the hidden word.</div>
            ${retryControls()}
        </div>
    `;

    const input = document.getElementById("guessInput");
    input.focus();

    setGameStatus(`Wordle is using ${wordLength}-letter words on ${currentDifficulty} mode.`);

    input.addEventListener("keydown", function (event) {
        if (event.key !== "Enter") {
            return;
        }

        const guess = this.value.toLowerCase();

        if (guess.length !== wordLength) {
            document.getElementById("wordleStatus").innerText =
                `Enter exactly ${wordLength} letters.`;
            return;
        }

        attempts += 1;

        const row = document.createElement("div");
        row.className = "grid";
        row.style.gridTemplateColumns = `repeat(${wordLength}, minmax(54px, 64px))`;

        for (let i = 0; i < wordLength; i += 1) {
            const cell = document.createElement("div");
            cell.className = "cell";
            cell.innerText = guess[i];

            if (guess[i] === word[i]) {
                cell.classList.add("correct");
            } else if (word.includes(guess[i])) {
                cell.classList.add("present");
            } else {
                cell.classList.add("miss");
            }

            row.appendChild(cell);
        }

        document.getElementById("gridWrap").appendChild(row);
        this.value = "";

        if (guess === word) {
            registerWin("Wordle", Math.max(40, (maxAttempts - attempts + 1) * 18), `${attempts} attempt(s)`);
            document.getElementById("wordleStatus").innerText =
                `You solved it in ${attempts} attempt${attempts > 1 ? "s" : ""}.`;
            this.disabled = true;
            setGameStatus("Wordle solved. Clean clue reading.");
            return;
        }

        if (attempts >= maxAttempts) {
            breakStreak();
            document.getElementById("wordleStatus").innerText =
                `Out of tries. The word was "${word}".`;
            this.disabled = true;
            setGameStatus("Round over. Try again and use each miss as information.");
            return;
        }

        document.getElementById("wordleStatus").innerText =
            `${maxAttempts - attempts} attempt(s) left.`;
    });
}

function shuffleWord(word) {
    let scrambled = word;

    while (scrambled === word) {
        scrambled = word
            .split("")
            .sort(() => Math.random() - 0.5)
            .join("");
    }

    return scrambled;
}

function startScramble() {
    setCurrentGame(startScramble);
    clearGameTimers();

    const entry = pickRandom(scrambleWords);
    const scrambled = shuffleWord(entry.word);
    let hintsUsed = 0;

    document.getElementById("gameArea").innerHTML = `
        <div class="featured-game">
            <div class="tag-row">
                <span class="tag">Hint system</span>
                <span class="tag">More challenge words</span>
            </div>
            <h3>Scramble</h3>
            <div class="rush-word">${scrambled}</div>
            <input id="scrambleInput" placeholder="Unscramble the word">
            <div class="control-row">
                <button class="secondary-btn" id="hintBtn">Use Hint</button>
            </div>
            <div class="hint-box" id="hintBox">Hints used: 0</div>
            ${retryControls()}
        </div>
    `;

    const input = document.getElementById("scrambleInput");
    const hintBox = document.getElementById("hintBox");

    input.focus();

    setGameStatus(
        "Scramble now rotates through more long words, so each solve asks for more pattern reading."
    );

    document.getElementById("hintBtn").addEventListener("click", () => {
        hintsUsed += 1;

        const maxHints = currentDifficulty === "easy" ? 3 : currentDifficulty === "hard" ? 2 : 3;

        if (hintsUsed > maxHints) {
            hintBox.innerText = "No more hints on this difficulty.";
            return;
        }

        if (hintsUsed === 1) {
            hintBox.innerText = `Hint: ${entry.hint}`;
        } else if (hintsUsed === 2) {
            hintBox.innerText =
                `Hint: ${entry.hint} First letter: ${entry.word[0].toUpperCase()}`;
        } else {
            hintBox.innerText =
                `Hint: ${entry.hint} First letter: ${entry.word[0].toUpperCase()} Length: ${entry.word.length}`;
        }
    });

    input.addEventListener("input", function () {
        if (this.value.toLowerCase() !== entry.word.toLowerCase()) {
            return;
        }

        registerWin(
            "Scramble",
            Math.max(45, 100 - hintsUsed * 20),
            hintsUsed === 0 ? "No-hint clear" : `${hintsUsed} hint(s) used`,
            hintsUsed < 3
        );
        hintBox.innerText =
            hintsUsed === 0
                ? "Perfect solve with no hints."
                : `Solved using ${hintsUsed} hint(s).`;
        this.disabled = true;
        setGameStatus("Scramble cleared. Nice pattern recognition.");
    });
}

function startQuickTap() {
    setCurrentGame(startQuickTap);
    clearGameTimers();

    let armed = false;
    let resolved = false;

    document.getElementById("gameArea").innerHTML = `
        <div class="featured-game">
            <div class="tag-row">
                <span class="tag">Reaction test</span>
                <span class="tag">Instant replay</span>
            </div>
            <h3>Quick Tap</h3>
            <p class="helper">
                Press start, wait for the signal to turn green, then click as fast as you can.
            </p>
            <button class="primary-btn" id="tapBtn">Start Signal</button>
            <div class="hint-box" id="tapResult">Wait for the prompt.</div>
            ${retryControls()}
        </div>
    `;

    const button = document.getElementById("tapBtn");
    const result = document.getElementById("tapResult");

    setGameStatus("A simple reaction game. Early clicks break the streak.");

    button.addEventListener("click", () => {
        if (resolved) {
            startQuickTap();
            return;
        }

        if (!armed && !quickTapTimeout) {
            result.innerText = "Get ready...";
            button.className = "secondary-btn";
            button.innerText = "Wait...";

            quickTapTimeout = setTimeout(() => {
                armed = true;
                quickTapStart = performance.now();
                button.className = "primary-btn";
                button.style.background = "linear-gradient(135deg,#22c55e,#86efac)";
                button.innerText = "TAP NOW";
                result.innerText = "Go!";
            }, (currentDifficulty === "easy" ? 1400 : currentDifficulty === "hard" ? 2200 : 1800) + Math.random() * 1800);

            return;
        }

        if (!armed) {
            clearTimeout(quickTapTimeout);
            quickTapTimeout = null;
            resolved = true;
            breakStreak();
            result.innerText = "Too early. That counts as a miss.";
            button.innerText = "Try Again";
            button.className = "secondary-btn";
            setGameStatus("Early click detected. Wait for the green signal next round.");
            return;
        }

        const reaction = Math.round(performance.now() - quickTapStart);

        resolved = true;
        registerWin(
            "Quick Tap",
            Math.max(35, 320 - reaction),
            `${reaction} ms reaction`
        );
        result.innerText = `Reaction time: ${reaction} ms`;
        button.innerText = "Play Again";
        setGameStatus(
            reaction < 250
                ? "Lightning fast reaction."
                : "Solid reaction. Run it again for a faster time."
        );
    });
}

function startMemoryMatch() {
    setCurrentGame(startMemoryMatch);
    clearGameTimers();

    const symbols = currentDifficulty === "easy"
        ? ["A", "A", "B", "B", "C", "C"]
        : currentDifficulty === "hard"
            ? ["A", "A", "B", "B", "C", "C", "D", "D", "E", "E"]
            : ["A", "A", "B", "B", "C", "C", "D", "D"];
    const deck = [...symbols].sort(() => Math.random() - 0.5);

    let firstCard = null;
    let matches = 0;
    let moves = 0;

    document.getElementById("gameArea").innerHTML = `
        <div class="featured-game">
            <div class="tag-row">
                <span class="tag">Memory</span>
                <span class="tag">4 pairs</span>
            </div>
            <h3>Memory Match</h3>
            <div class="memory-grid" id="memoryGrid"></div>
            <div class="scoreboard">
                <div class="score-card"><span>Moves</span><strong id="memoryMoves">0</strong></div>
                <div class="score-card"><span>Pairs</span><strong id="memoryPairs">0/${symbols.length / 2}</strong></div>
            </div>
            <div class="typing-status" id="memoryStatus">Flip two cards at a time.</div>
            ${retryControls()}
        </div>
    `;

    const grid = document.getElementById("memoryGrid");

    setGameStatus("Match all four pairs with as few moves as you can.");

    deck.forEach((symbol) => {
        const card = document.createElement("button");
        card.className = "memory-card";
        card.dataset.symbol = symbol;
        card.innerText = "?";

        card.addEventListener("click", function () {
            if (memoryLock || this.classList.contains("matched") || this === firstCard) {
                return;
            }

            this.classList.add("revealed");
            this.innerText = symbol;

            if (!firstCard) {
                firstCard = this;
                return;
            }

            moves += 1;
            document.getElementById("memoryMoves").innerText = moves;

            if (firstCard.dataset.symbol === symbol) {
                this.classList.add("matched");
                firstCard.classList.add("matched");
                this.classList.remove("revealed");
                firstCard.classList.remove("revealed");
                firstCard = null;
                matches += 1;

                document.getElementById("memoryPairs").innerText = `${matches}/${symbols.length / 2}`;

                if (matches === symbols.length / 2) {
                    const cleanMoves = currentDifficulty === "easy" ? 5 : currentDifficulty === "hard" ? 9 : 6;
                    registerWin(
                        "Memory Match",
                        Math.max(40, 120 - moves * 8),
                        `${moves} move(s)`,
                        moves <= cleanMoves
                    );
                    document.getElementById("memoryStatus").innerText =
                        `Board cleared in ${moves} move(s).`;
                    setGameStatus("Memory Match cleared. Smooth recall.");
                }

                return;
            }

            memoryLock = true;
            const previous = firstCard;

            document.getElementById("memoryStatus").innerText =
                "Not a pair. Try to remember the positions.";

            setTimeout(() => {
                this.classList.remove("revealed");
                previous.classList.remove("revealed");
                this.innerText = "?";
                previous.innerText = "?";
                firstCard = null;
                memoryLock = false;
            }, 700);
        });

        grid.appendChild(card);
    });
}

function flashSequence(sequence, index = 0) {
    if (index >= sequence.length) {
        sequenceTimer = null;
        document.getElementById("sequenceStatus").innerText =
            "Your turn. Repeat the full pattern.";
        return;
    }

    const button = document.querySelector(`[data-seq="${sequence[index]}"]`);
    button.classList.add("active-sequence");

    sequenceTimer = setTimeout(() => {
        button.classList.remove("active-sequence");
        sequenceTimer = setTimeout(() => flashSequence(sequence, index + 1), 180);
    }, 550);
}

function startSequenceRecall() {
    setCurrentGame(startSequenceRecall);
    clearGameTimers();

    const sequenceLength = currentDifficulty === "easy" ? 4 : currentDifficulty === "hard" ? 6 : 5;
    const sequence = Array.from({ length: sequenceLength }, () => pickRandom(sequenceSymbols));
    let progress = 0;

    document.getElementById("gameArea").innerHTML = `
        <div class="featured-game">
            <div class="tag-row">
                <span class="tag">Pattern</span>
                <span class="tag">5-step recall</span>
            </div>
            <h3>Sequence Recall</h3>
            <p class="helper">
                Watch the symbols light up, then click them back in the same order.
            </p>
            <div class="sequence-grid" id="sequenceGrid"></div>
            <div class="typing-status" id="sequenceStatus">Memorize the pattern...</div>
            ${retryControls()}
        </div>
    `;

    const grid = document.getElementById("sequenceGrid");

    setGameStatus("Stay focused through the full pattern before you click.");

    sequenceSymbols.forEach((symbol) => {
        const button = document.createElement("button");
        button.className = "sequence-btn";
        button.dataset.seq = symbol;
        button.innerText = symbol;

        button.addEventListener("click", () => {
            if (sequenceTimer) {
                return;
            }

            if (symbol === sequence[progress]) {
                progress += 1;
                document.getElementById("sequenceStatus").innerText =
                    `Good. ${progress}/${sequence.length} correct.`;

                if (progress === sequence.length) {
                    registerWin(
                        "Sequence Recall",
                        sequence.length * 20,
                        `${sequence.length}-step pattern`
                    );
                    document.getElementById("sequenceStatus").innerText =
                        "Full pattern repeated correctly.";
                    setGameStatus("Sequence Recall cleared. Nice concentration.");
                }

                return;
            }

            const expected = sequence[progress];
            breakStreak();
            progress = 0;
            document.getElementById("sequenceStatus").innerText =
                `Missed it. The expected symbol was ${expected}.`;
            setGameStatus("Pattern broken. Run it again and watch the order closely.");
        });

        grid.appendChild(button);
    });

    flashSequence(sequence);
}

function nextMathProblem() {
    const a = Math.floor(Math.random() * 12) + 1;
    const b = Math.floor(Math.random() * 12) + 1;

    if (Math.random() > 0.5) {
        return {
            question: `${a + b} - ${b} = ?`,
            answer: a
        };
    }

    return {
        question: `${a} + ${b} = ?`,
        answer: a + b
    };
}

function startMathSprint() {
    setCurrentGame(startMathSprint);
    clearGameTimers();

    let score = 0;
    let timeLeft = currentDifficulty === "easy" ? 30 : currentDifficulty === "hard" ? 18 : 25;
    let current = nextMathProblem();
    const goal = currentDifficulty === "easy" ? 6 : currentDifficulty === "hard" ? 10 : 8;

    document.getElementById("gameArea").innerHTML = `
        <div class="featured-game">
            <div class="tag-row">
                <span class="tag">Timer</span>
                <span class="tag">Mental speed</span>
            </div>
            <h3>Math Sprint</h3>
            <div class="math-problem" id="mathProblem">${current.question}</div>
            <div class="meter"><div class="meter-fill" id="mathMeter"></div></div>
            <input id="mathInput" type="number" placeholder="Answer here">
            <div class="scoreboard">
                <div class="score-card"><span>Score</span><strong id="mathScore">0</strong></div>
                <div class="score-card"><span>Time Left</span><strong id="mathTime">${timeLeft}s</strong></div>
            </div>
            <div class="typing-status" id="mathStatus">Press Enter after each answer.</div>
            ${retryControls()}
        </div>
    `;

    const input = document.getElementById("mathInput");
    input.focus();

    setGameStatus(`Answer quickly. Reach ${goal} correct before the timer ends to win.`);

    rushTimer = setInterval(() => {
        timeLeft -= 1;
        document.getElementById("mathTime").innerText = `${timeLeft}s`;
        document.getElementById("mathMeter").style.width = `${(timeLeft / (currentDifficulty === "easy" ? 30 : currentDifficulty === "hard" ? 18 : 25)) * 100}%`;

        if (timeLeft > 0) {
            return;
        }

        clearInterval(rushTimer);
        input.disabled = true;

        if (score >= goal) {
            registerWin("Math Sprint", score * 12, `${score} correct in ${currentDifficulty}`);
            document.getElementById("mathStatus").innerText =
                `Sprint cleared with ${score} correct.`;
            setGameStatus("Math Sprint cleared. Fast thinking.");
        } else {
            breakStreak();
            document.getElementById("mathStatus").innerText = `Time up. You scored ${score}.`;
            setGameStatus(`Math Sprint ended. Reach ${goal} correct next round.`);
        }
    }, 1000);

    input.addEventListener("keydown", function (event) {
        if (event.key !== "Enter") {
            return;
        }

        const value = Number(this.value);

        if (value === current.answer) {
            score += 1;
            document.getElementById("mathScore").innerText = score;
            document.getElementById("mathStatus").innerText = "Correct. Next one.";
        } else {
            document.getElementById("mathStatus").innerText =
                `Not quite. Correct answer: ${current.answer}`;
        }

        current = nextMathProblem();
        document.getElementById("mathProblem").innerText = current.question;
        this.value = "";
    });
}

function startColorMatch() {
    setCurrentGame(startColorMatch);
    clearGameTimers();

    let round = 0;
    let score = 0;
    let current = pickRandom(colorRounds);
    const totalRounds = currentDifficulty === "easy" ? 4 : currentDifficulty === "hard" ? 6 : 5;
    const goal = currentDifficulty === "easy" ? 3 : currentDifficulty === "hard" ? 5 : 4;

    function renderRound() {
        document.getElementById("gameArea").innerHTML = `
            <div class="featured-game">
                <div class="tag-row">
                    <span class="tag">Color reading</span>
                    <span class="tag">5 rounds</span>
                </div>
                <h3>Color Match</h3>
                <p class="helper">Click the real color of the word, not the word itself.</p>
                <div class="color-word" style="color:${current.color}">${current.word}</div>
                <div class="choice-grid" id="colorChoices"></div>
                <div class="scoreboard">
                    <div class="score-card"><span>Round</span><strong id="colorRound">${round + 1}/${totalRounds}</strong></div>
                    <div class="score-card"><span>Score</span><strong id="colorScore">${score}</strong></div>
                </div>
                <div class="typing-status" id="colorStatus">Choose the matching color name.</div>
                ${retryControls()}
            </div>
        `;

        const choiceWrap = document.getElementById("colorChoices");
        current.options.forEach((option) => {
            const button = document.createElement("button");
            button.className = "choice-btn";
            button.innerText = option;
            button.addEventListener("click", () => {
                if (option === current.word) {
                    score += 1;
                    document.getElementById("colorStatus").innerText = "Correct.";
                } else {
                    document.getElementById("colorStatus").innerText = `Not quite. It was ${current.word}.`;
                }

                round += 1;
                if (round >= totalRounds) {
                    if (score >= goal) {
                        registerWin("Color Match", score * 20, `${score}/${totalRounds} correct`);
                        setGameStatus(`Color Match cleared with ${score}/${totalRounds}.`);
                    } else {
                        breakStreak();
                        setGameStatus(`Color Match ended at ${score}/${totalRounds}. Reach ${goal} to win.`);
                    }
                    document.getElementById("colorRound").innerText = "Done";
                    document.getElementById("colorScore").innerText = score;
                    Array.from(choiceWrap.children).forEach((node) => {
                        node.disabled = true;
                    });
                    return;
                }

                current = pickRandom(colorRounds);
                setTimeout(renderRound, 350);
            });
            choiceWrap.appendChild(button);
        });
    }

    setGameStatus("Ignore the text meaning and choose the true color.");
    renderRound();
}

function startOddOneOut() {
    setCurrentGame(startOddOneOut);
    clearGameTimers();

    let round = 0;
    let score = 0;
    let current = pickRandom(oddOneOutRounds);
    const totalRounds = currentDifficulty === "easy" ? 4 : currentDifficulty === "hard" ? 6 : 5;
    const goal = currentDifficulty === "easy" ? 3 : currentDifficulty === "hard" ? 5 : 4;

    function renderRound() {
        document.getElementById("gameArea").innerHTML = `
            <div class="featured-game">
                <div class="tag-row">
                    <span class="tag">Category logic</span>
                    <span class="tag">5 rounds</span>
                </div>
                <h3>Odd One Out</h3>
                <p class="helper">${current.prompt}</p>
                <div class="choice-grid" id="oddChoices"></div>
                <div class="scoreboard">
                    <div class="score-card"><span>Round</span><strong id="oddRound">${round + 1}/${totalRounds}</strong></div>
                    <div class="score-card"><span>Score</span><strong id="oddScore">${score}</strong></div>
                </div>
                <div class="typing-status" id="oddStatus">Pick the item that does not belong.</div>
                ${retryControls()}
            </div>
        `;

        const choiceWrap = document.getElementById("oddChoices");
        [...current.options].sort(() => Math.random() - 0.5).forEach((option) => {
            const button = document.createElement("button");
            button.className = "choice-btn";
            button.innerText = option;
            button.addEventListener("click", () => {
                if (option === current.answer) {
                    score += 1;
                    document.getElementById("oddStatus").innerText = "Correct choice.";
                } else {
                    document.getElementById("oddStatus").innerText = `The odd one was ${current.answer}.`;
                }

                round += 1;
                if (round >= totalRounds) {
                    if (score >= goal) {
                        registerWin("Odd One Out", score * 20, `${score}/${totalRounds} correct`);
                        setGameStatus(`Odd One Out cleared with ${score}/${totalRounds}.`);
                    } else {
                        breakStreak();
                        setGameStatus(`Odd One Out ended at ${score}/${totalRounds}. Reach ${goal} to win.`);
                    }
                    document.getElementById("oddRound").innerText = "Done";
                    document.getElementById("oddScore").innerText = score;
                    Array.from(choiceWrap.children).forEach((node) => {
                        node.disabled = true;
                    });
                    return;
                }

                current = pickRandom(oddOneOutRounds);
                setTimeout(renderRound, 350);
            });
            choiceWrap.appendChild(button);
        });
    }

    setGameStatus("Look for the pattern, then spot the outsider.");
    renderRound();
}

function startFlashType() {
    setCurrentGame(startFlashType);
    clearGameTimers();

    const phrase = pickRandom(flashPhrases);
    let hidden = false;
    const previewStart = currentDifficulty === "easy" ? 5 : currentDifficulty === "hard" ? 2 : 3;

    document.getElementById("gameArea").innerHTML = `
        <div class="featured-game">
            <div class="tag-row">
                <span class="tag">Memory typing</span>
                <span class="tag">Flash challenge</span>
            </div>
            <h3>Flash Type</h3>
            <div class="flash-card" id="flashPhrase">${phrase}</div>
            <input id="flashInput" placeholder="Type the phrase from memory" disabled>
            <div class="scoreboard">
                <div class="score-card"><span>Preview</span><strong id="flashTimer">${previewStart}s</strong></div>
                <div class="score-card"><span>Goal</span><strong>Perfect</strong></div>
            </div>
            <div class="typing-status" id="flashStatus">Memorize the phrase before it disappears.</div>
            ${retryControls()}
        </div>
    `;

    const phraseBox = document.getElementById("flashPhrase");
    const input = document.getElementById("flashInput");
    let preview = previewStart;

    setGameStatus("Watch the phrase, then type it back exactly from memory.");

    rushTimer = setInterval(() => {
        preview -= 1;
        document.getElementById("flashTimer").innerText = `${preview}s`;

        if (preview > 0) {
            return;
        }

        clearInterval(rushTimer);
        hidden = true;
        phraseBox.innerText = "Phrase hidden. Type what you remember.";
        input.disabled = false;
        input.focus();
        document.getElementById("flashTimer").innerText = "Go";
    }, 1000);

    input.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" || !hidden) {
            return;
        }

        if (this.value.trim() === phrase) {
            registerWin("Flash Type", previewStart * 30, `${previewStart}s preview`);
            document.getElementById("flashStatus").innerText = "Perfect memory run.";
            setGameStatus("Flash Type cleared. Excellent recall.");
        } else {
            breakStreak();
            document.getElementById("flashStatus").innerText = `Not exact. Phrase: "${phrase}"`;
            setGameStatus("Flash Type missed. Try to keep more of the sentence next round.");
        }

        this.disabled = true;
    });
}

document.addEventListener("DOMContentLoaded", () => {
    syncGameStats();

    document.getElementById("gameArea").innerHTML = `
        <div class="featured-game">
            <h3>Game Room Ready</h3>
            <p class="helper">
                Pick a game above to load it here. The tracker on the right will update as you win rounds.
            </p>
        </div>
    `;
});
