const passages = {
    easy: [
        "Practice typing every day to improve speed.",
        "Small steps each day can build strong typing habits.",
        "Short drills can sharpen your timing and accuracy.",
        "Keep your fingers relaxed and let the rhythm guide you."
    ],
    medium: [
        "Typing with steady rhythm is often better than rushing and making too many mistakes.",
        "Good keyboard control comes from focus, repetition, and careful correction.",
        "Consistent practice can turn hesitant typing into confident movement.",
        "A calm pace with fewer mistakes usually beats frantic speed in the long run."
    ],
    hard: [
        "Accuracy matters because a fast result filled with errors slows your real work in the end.",
        "Strong typing combines speed, control, punctuation, and the patience to stay consistent.",
        "A skilled typist balances pace with precision while keeping each sentence readable.",
        "Longer passages reveal whether your control holds up when fatigue and punctuation appear."
    ]
};

const statsKey = "typingGameHubStats";

let typingMode = "easy";
let activePassage = "";
let typingStarted = false;
let typingStartTime = 0;
let typingTimer = null;

function readStats() {
    try {
        return (
            JSON.parse(localStorage.getItem(statsKey)) || {
                bestWpm: 0,
                gamesWon: 0,
                streak: 0,
                bestStreak: 0
            }
        );
    } catch {
        return {
            bestWpm: 0,
            gamesWon: 0,
            streak: 0,
            bestStreak: 0
        };
    }
}

function writeStats(next) {
    localStorage.setItem(statsKey, JSON.stringify(next));
}

function pickRandom(items) {
    return items[Math.floor(Math.random() * items.length)];
}

function setTypingMode(mode) {
    typingMode = mode;

    document.querySelectorAll(".mode-card").forEach((card) => {
        card.classList.toggle("active-mode", card.dataset.mode === mode);
    });

    document.getElementById("typingStatus").innerText =
        "Mode selected. Start the run when you're ready.";
}

function renderPassageFeedback(inputValue) {
    const words = activePassage.split(" ");
    const typedWords = inputValue.trim().length
        ? inputValue.trim().split(/\s+/)
        : [];

    const markup = words
        .map((word, index) => {
            let className = "word";

            if (index < typedWords.length) {
                className +=
                    typedWords[index] === word
                        ? " correct-word"
                        : " incorrect-word";
            } else if (index === typedWords.length) {
                className += " current-word";
            }

            return `<span class="${className}">${word}</span>`;
        })
        .join("");

    document.getElementById("text").innerHTML = markup;
}

function updateTypingStats(inputValue, finished = false) {
    const elapsed = Math.max((Date.now() - typingStartTime) / 1000, 0.1);
    const typedChars = inputValue.length;
    const correctChars = inputValue
        .split("")
        .filter((char, index) => char === activePassage[index]).length;
    const accuracy = typedChars
        ? Math.round((correctChars / typedChars) * 100)
        : 100;
    const wordsTyped = inputValue.trim().length
        ? inputValue.trim().split(/\s+/).length
        : 0;
    const wpm = finished
        ? Math.round((activePassage.split(" ").length / elapsed) * 60)
        : Math.round((wordsTyped / elapsed) * 60);

    document.getElementById("accuracy").innerText = `${accuracy}%`;
    document.getElementById("wpm").innerText = Number.isFinite(wpm) ? wpm : 0;
    document.getElementById("timer").innerText = `${elapsed.toFixed(1)}s`;
}

function startTyping() {
    resetTyping(false);

    activePassage = pickRandom(passages[typingMode]);
    typingStarted = true;
    typingStartTime = Date.now();

    const input = document.getElementById("typeInput");
    input.disabled = false;
    input.value = "";
    input.focus();

    document.getElementById("typingStatus").innerText =
        "Run live. Finish the full sentence to lock in your score.";

    renderPassageFeedback("");

    typingTimer = setInterval(() => {
        if (typingStarted) {
            updateTypingStats(input.value);
        }
    }, 100);
}

function resetTyping(updateStatus = true) {
    clearInterval(typingTimer);

    typingStarted = false;
    typingTimer = null;

    document.getElementById("typeInput").disabled = true;
    document.getElementById("typeInput").value = "";
    document.getElementById("text").innerText = "Press start to load a passage.";
    document.getElementById("wpm").innerText = "0";
    document.getElementById("accuracy").innerText = "100%";
    document.getElementById("timer").innerText = "0.0s";

    if (updateStatus) {
        document.getElementById("typingStatus").innerText =
            "Run cleared. Choose a mode and start again.";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const stats = readStats();
    const input = document.getElementById("typeInput");

    document.getElementById("bestWpm").innerText = stats.bestWpm || 0;

    input.addEventListener("input", function () {
        if (!typingStarted) {
            return;
        }

        const currentValue = this.value;

        renderPassageFeedback(currentValue);
        updateTypingStats(currentValue);

        if (currentValue !== activePassage) {
            return;
        }

        clearInterval(typingTimer);
        typingStarted = false;

        updateTypingStats(currentValue, true);

        const finalWpm = Number(document.getElementById("wpm").innerText) || 0;
        const nextStats = readStats();

        if (finalWpm > nextStats.bestWpm) {
            nextStats.bestWpm = finalWpm;
            writeStats(nextStats);
        }

        document.getElementById("bestWpm").innerText = readStats().bestWpm || 0;
        document.getElementById("typingStatus").innerText =
            "Run complete. Nice work. Try another mode to push your best score.";

        this.disabled = true;
    });
});
