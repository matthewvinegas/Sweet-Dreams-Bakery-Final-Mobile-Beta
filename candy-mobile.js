var candies = ["Blue", "Orange", "Green", "Yellow", "Red", "Purple"];
var board = [];
var rows = 9;
var columns = 9;
var level = 1;
var score = 0;
var highScore = 0;
var moves = 30; // Number of moves per level
var maxMoves = 30; // Max moves for each level
var gameOver = false;
var currTile;
var otherTile;

// Order tray system
var candiesDestroyed = 0; // Counter for destroyed candies
var orderTraySpecials = []; // Current special candies on tray
var specialCandyTypes = [
    "Blue-Striped-Horizontal",
    "Blue-Striped-Vertical",
    "Red-Striped-Horizontal",
    "Red-Striped-Vertical",
    "Green-Striped-Horizontal",
    "Green-Striped-Vertical",
    "Yellow-Striped-Horizontal",
    "Yellow-Striped-Vertical",
    "Orange-Striped-Horizontal",
    "Orange-Striped-Vertical",
    "Purple-Striped-Horizontal",
    "Purple-Striped-Vertical",
    "Blue-Wrapped",
    "Red-Wrapped",
    "Green-Wrapped",
    "Yellow-Wrapped",
    "Orange-Wrapped",
    "Purple-Wrapped",
    "Choco"
];

// Level goals - each level specifies which candies to collect and how many
var levelGoals = [
    { Blue: 30 },      // Level 1
    { Red: 30 },       // Level 2  
    { Green: 25, Orange: 25 },  // Level 3
    { Yellow: 40 },    // Level 4
    { Blue: 20, Red: 20, Green: 20 },  // Level 5
    { Blue: 15, Orange: 15, Green: 15, Yellow: 15, Red: 15, Purple: 15 },  // Level 6
    { "Blue-Striped-Horizontal": 1, "Red-Striped-Vertical": 1  },  // Level 7 - Create striped candies!
    { Purple: 35, Orange: 35 },  // Level 8
    { "Green-Wrapped": 1, Yellow: 25 },  // Level 9 - Create wrapped candies!
    { "Blue-Striped-Horizontal": 2, "Red-Striped-Vertical": 1, "Green-Wrapped": 2 },  // Level 10 - All specials!
    { Choco: 1, Blue: 30 },  // Level 11 - Create chocolate!
    { Red: 40, Green: 40, Blue: 40 },  // Level 12
    { "Orange-Wrapped": 3, "Purple-Striped-Horizontal": 3 },  // Level 13
    { Yellow: 50 },  // Level 14
    { Choco: 2, "Blue-Wrapped": 2 },  // Level 15
    { Blue: 25, Orange: 25, Green: 25, Yellow: 25, Red: 25, Purple: 25 },  // Level 16 - All colors!
    { "Red-Striped-Horizontal": 4, "Blue-Striped-Vertical": 4, "Green-Wrapped": 3 },  // Level 17
    { Choco: 3 },  // Level 18 - 3 Chocolates!
    { Purple: 60 },  // Level 19
    { Choco: 2, "Orange-Wrapped": 3, "Yellow-Striped-Horizontal": 3, Blue: 20 }  // Level 20 - FINAL CHALLENGE!
];

// Track collected candies for current level (including special candies)
var collectedCandies = {};

window.onload = function() {
    // Load high score from localStorage
    highScore = parseInt(localStorage.getItem('candyCrushHighScore')) || 0;
    
    document.getElementById("play-button").addEventListener("click", function() {
        document.getElementById("home-screen").style.display = "none";
        document.getElementById("game-screen").style.display = "block";
        startGame();
        setupLevel();
    });
    
    document.getElementById("exit-button").addEventListener("click", function() {
        window.close();
        setTimeout(function() {
            alert("Please close this tab manually.");
        }, 100);
    });
    
    document.getElementById("exit-game-button").addEventListener("click", function() {
        resetGame();
        document.getElementById("game-screen").style.display = "none";
        document.getElementById("home-screen").style.display = "flex";
    });
    
    // Game loop
    window.setInterval(function(){
        if (document.getElementById("game-screen").style.display !== "none") {
            crushCandy();
            slideCandy();
            generateCandy();
            checkLevelComplete();
        }
    }, 100);
}

function resetGame() {
    level = 1;
    score = 0;
    gameOver = false;
    board = [];
    collectedCandies = {};
    document.getElementById("board").innerHTML = "";
    document.getElementById("message").innerText = "";
}

function setupLevel() {
    collectedCandies = {};
    var currentGoals = levelGoals[level - 1];
    
    for (var candy in currentGoals) {
        collectedCandies[candy] = 0;
    }
    
    // Reset moves for new level
    moves = maxMoves;
    candiesDestroyed = 0;
    
    updateDisplay();
    updateOrderTray(); // Initialize with random special candies
    updateProgressBar();
}

function updateDisplay() {
    document.getElementById("level-display").innerText = level;
    document.getElementById("score-display").innerText = score;
    document.getElementById("high-score-display").innerText = highScore;
    document.getElementById("moves-display").innerText = moves;
    
    // Highlight moves in red when low (5 or fewer)
    let movesDisplay = document.getElementById("moves-display");
    if (moves <= 5) {
        movesDisplay.classList.add("low-moves");
    } else {
        movesDisplay.classList.remove("low-moves");
    }
    
    var goalsContainer = document.getElementById("goals-container");
    goalsContainer.innerHTML = "";
    
    var currentGoals = levelGoals[level - 1];
    
    for (var candy in currentGoals) {
        var goalItem = document.createElement("div");
        goalItem.className = "goal-item";
        
        var remaining = currentGoals[candy] - (collectedCandies[candy] || 0);
        if (remaining <= 0) {
            remaining = 0;
            goalItem.classList.add("completed");
        }
        
        // Handle special candy images (like Blue-Striped-Horizontal)
        var imagePath = "./images/" + candy + ".png";
        
        goalItem.innerHTML = `
            <img src="${imagePath}" alt="${candy}">
            <span class="goal-count">${remaining}</span>
        `;
        
        goalsContainer.appendChild(goalItem);
    }
}

function saveHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('candyCrushHighScore', highScore);
        updateDisplay();
    }
}

function randomCandy() {
    return candies[Math.floor(Math.random() * candies.length)];
}

function startGame() {
    for (let r = 0; r < rows; r++) {
        let row = [];
        for (let c = 0; c < columns; c++) {
            let tile = document.createElement("img");
            tile.id = r.toString() + "-" + c.toString();
            tile.src = "./images/" + randomCandy() + ".png";
            
            // Desktop drag events
            tile.addEventListener("dragstart", dragStart);
            tile.addEventListener("dragover", dragOver);
            tile.addEventListener("dragenter", dragEnter);
            tile.addEventListener("dragleave", dragLeave);
            tile.addEventListener("drop", dragDrop);
            tile.addEventListener("dragend", dragEnd);
            
            // Mobile touch events
            tile.addEventListener("touchstart", touchStart, {passive: false});
            tile.addEventListener("touchmove", touchMove, {passive: false});
            tile.addEventListener("touchend", touchEnd, {passive: false});
            
            // Click for special candies
            tile.addEventListener("click", handleSpecialCandyClick);
            tile.draggable = true;
            
            document.getElementById("board").append(tile);
            row.push(tile);
        }
        board.push(row);
    }
}

// Touch handling for mobile
var touchStartTile = null;
var touchStartX = 0;
var touchStartY = 0;

function touchStart(e) {
    e.preventDefault();
    touchStartTile = e.target;
    let touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
}

function touchMove(e) {
    e.preventDefault();
}

function touchEnd(e) {
    e.preventDefault();
    if (!touchStartTile) return;
    
    let touch = e.changedTouches[0];
    let touchEndX = touch.clientX;
    let touchEndY = touch.clientY;
    
    let deltaX = touchEndX - touchStartX;
    let deltaY = touchEndY - touchStartY;
    
    // Minimum swipe distance
    let minSwipe = 30;
    
    if (Math.abs(deltaX) < minSwipe && Math.abs(deltaY) < minSwipe) {
        // Too small, treat as tap for special candies
        handleSpecialCandyClick({target: touchStartTile});
        touchStartTile = null;
        return;
    }
    
    // Determine swipe direction
    let coords = touchStartTile.id.split("-");
    let r = parseInt(coords[0]);
    let c = parseInt(coords[1]);
    
    let targetR = r;
    let targetC = c;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0 && c < columns - 1) {
            targetC = c + 1; // Swipe right
        } else if (deltaX < 0 && c > 0) {
            targetC = c - 1; // Swipe left
        }
    } else {
        // Vertical swipe
        if (deltaY > 0 && r < rows - 1) {
            targetR = r + 1; // Swipe down
        } else if (deltaY < 0 && r > 0) {
            targetR = r - 1; // Swipe up
        }
    }
    
    // Perform swap
    if (targetR !== r || targetC !== c) {
        currTile = touchStartTile;
        otherTile = board[targetR][targetC];
        
        if (currTile.src.includes("blank") || otherTile.src.includes("blank")) {
            touchStartTile = null;
            return;
        }
        
        let currImg = currTile.src;
        let otherImg = otherTile.src;
        currTile.src = otherImg;
        otherTile.src = currImg;
        
        let validMove = checkValid();
        if (!validMove) {
            // Swap back
            currTile.src = currImg;
            otherTile.src = otherImg;
        } else {
            // Valid move - decrease moves counter
            moves--;
            updateDisplay();
            checkMovesRemaining();
        }
    }
    
    touchStartTile = null;
}

function checkLevelComplete() {
    if (gameOver) return;
    
    var currentGoals = levelGoals[level - 1];
    var allCompleted = true;
    
    for (var candy in currentGoals) {
        if (collectedCandies[candy] < currentGoals[candy]) {
            allCompleted = false;
            break;
        }
    }
    
    if (allCompleted) {
        gameOver = true;
        saveHighScore();
        
        setTimeout(() => {
            level++;
            if (level <= levelGoals.length) {
                document.getElementById("message").innerText = `Level ${level-1} Complete! Starting Level ${level}`;
                setTimeout(() => {
                    document.getElementById("message").innerText = "";
                    gameOver = false;
                    setupLevel();
                }, 2000);
            } else {
                document.getElementById("message").innerText = "Congratulations! You completed all levels!";
            }
        }, 500);
    }
}

function collectCandy(candyColor, amount) {
    var currentGoals = levelGoals[level - 1];
    
    if (currentGoals[candyColor] !== undefined) {
        collectedCandies[candyColor] = (collectedCandies[candyColor] || 0) + amount;
    }
    
    score += amount * 10;
    
    // Track destroyed candies for order tray progress
    for (let i = 0; i < amount; i++) {
        trackDestroyedCandy();
    }
    
    updateDisplay();
}

function dragStart() {
    currTile = this;
}

function dragOver(e) {
    e.preventDefault();
}

function dragEnter(e) {
    e.preventDefault();
}

function dragLeave() {}

function dragDrop() {
    otherTile = this;
}

function dragEnd() {
    if (currTile.src.includes("blank") || otherTile.src.includes("blank")) {
        return;
    }

    let currCoords = currTile.id.split("-");
    let r = parseInt(currCoords[0]);
    let c = parseInt(currCoords[1]);

    let otherCoords = otherTile.id.split("-");
    let r2 = parseInt(otherCoords[0]);
    let c2 = parseInt(otherCoords[1]);

    let moveLeft = c2 == c-1 && r == r2;
    let moveRight = c2 == c+1 && r == r2;
    let moveUp = r2 == r-1 && c == c2;
    let moveDown = r2 == r+1 && c == c2;

    let isAdjacent = moveLeft || moveRight || moveUp || moveDown;

    if (isAdjacent) {
        let currImg = currTile.src;
        let otherImg = otherTile.src;
        currTile.src = otherImg;
        otherTile.src = currImg;

        let validMove = checkValid();
        if (!validMove) {
            let currImg = currTile.src;
            let otherImg = otherTile.src;
            currTile.src = otherImg;
            otherTile.src = currImg;
        } else {
            // Valid move - decrease moves counter
            moves--;
            updateDisplay();
            checkMovesRemaining();
        }
    }
}

function handleSpecialCandyClick(e) {
    let tile = e.target;
    
    // Check if this is a special candy
    let isSpecial = tile.src.includes("Striped") || tile.src.includes("Wrapped") || tile.src.includes("Choco");
    
    if (!isSpecial) return;
    
    // Get the tile's position
    let coords = tile.id.split("-");
    let r = parseInt(coords[0]);
    let c = parseInt(coords[1]);
    
    // Check for adjacent special candies to combine
    let adjacentSpecials = [];
    
    // Check all 4 adjacent tiles
    if (r > 0) adjacentSpecials.push({tile: board[r-1][c], r: r-1, c: c});
    if (r < rows-1) adjacentSpecials.push({tile: board[r+1][c], r: r+1, c: c});
    if (c > 0) adjacentSpecials.push({tile: board[r][c-1], r: r, c: c-1});
    if (c < columns-1) adjacentSpecials.push({tile: board[r][c+1], r: r, c: c+1});
    
    // Find if there's a special candy adjacent
    for (let adj of adjacentSpecials) {
        let adjTile = adj.tile;
        let isAdjSpecial = adjTile.src.includes("Striped") || adjTile.src.includes("Wrapped") || adjTile.src.includes("Choco");
        
        if (isAdjSpecial) {
            // Combine the two special candies!
            combineSpecialCandies(tile, adjTile, r, c, adj.r, adj.c);
            return;
        }
    }
    
    // No combination, activate normally
    if (tile.src.includes("Striped-Horizontal")) {
        activateHorizontalStriped(tile);
    } else if (tile.src.includes("Striped-Vertical")) {
        activateVerticalStriped(tile);
    } else if (tile.src.includes("Wrapped")) {
        activateWrapped(tile);
    } else if (tile.src.includes("Choco")) {
        activateChocolate(tile);
    }
}

function combineSpecialCandies(tile1, tile2, r1, c1, r2, c2) {
    let type1 = getSpecialType(tile1.src);
    let type2 = getSpecialType(tile2.src);
    
    // Add explosion effect
    tile1.classList.add("exploding");
    tile2.classList.add("exploding");
    
    setTimeout(() => {
        tile1.src = "./images/blank.png";
        tile2.src = "./images/blank.png";
        tile1.classList.remove("exploding");
        tile2.classList.remove("exploding");
    }, 600);
    
    // Determine combination effect
    if (type1 === "choco" || type2 === "choco") {
        // Choco + Any Special = Clear entire board!
        comboClearBoard();
    } else if (type1 === "horizontal" && type2 === "vertical") {
        // Horizontal + Vertical = Giant + (cross)
        comboGiantCross(r1, c1);
    } else if (type1 === "vertical" && type2 === "horizontal") {
        comboGiantCross(r1, c1);
    } else if ((type1 === "horizontal" || type1 === "vertical") && type2 === "wrapped") {
        // Striped + Wrapped = 3 rows/columns
        comboStripedWrapped(type1 === "wrapped" ? type2 : type1, r1, c1);
    } else if (type1 === "wrapped" && (type2 === "horizontal" || type2 === "vertical")) {
        comboStripedWrapped(type2, r1, c1);
    } else if (type1 === "wrapped" && type2 === "wrapped") {
        // Wrapped + Wrapped = 5x5 explosion
        comboDoubleWrapped(r1, c1);
    } else if (type1 === type2 && (type1 === "horizontal" || type1 === "vertical")) {
        // Two same striped = Clear row AND column
        comboDoubleStriped(r1, c1);
    }
}

function getSpecialType(src) {
    if (src.includes("Choco")) return "choco";
    if (src.includes("Striped-Horizontal")) return "horizontal";
    if (src.includes("Striped-Vertical")) return "vertical";
    if (src.includes("Wrapped")) return "wrapped";
    return "normal";
}

function comboClearBoard() {
    // Clear entire board!
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            let color = getBaseColor(board[r][c].src);
            if (color) {
                collectCandy(color, 1);
            }
            board[r][c].classList.add("exploding");
            setTimeout(() => {
                board[r][c].src = "./images/blank.png";
                board[r][c].classList.remove("exploding");
            }, 600);
        }
    }
}

function comboGiantCross(r, c) {
    // Clear entire row and column (+ shape)
    for (let col = 0; col < columns; col++) {
        let color = getBaseColor(board[r][col].src);
        if (color) {
            collectCandy(color, 1);
        }
        board[r][col].classList.add("popping");
        setTimeout(() => {
            board[r][col].src = "./images/blank.png";
            board[r][col].classList.remove("popping");
        }, 400);
    }
    
    for (let row = 0; row < rows; row++) {
        if (row !== r) { // Don't double-count center
            let color = getBaseColor(board[row][c].src);
            if (color) {
                collectCandy(color, 1);
            }
            board[row][c].classList.add("popping");
            setTimeout(() => {
                board[row][c].src = "./images/blank.png";
                board[row][c].classList.remove("popping");
            }, 400);
        }
    }
}

function comboStripedWrapped(stripedType, r, c) {
    // Clears 3 rows or 3 columns
    if (stripedType === "horizontal") {
        // Clear 3 rows
        for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
            let targetRow = r + rowOffset;
            if (targetRow >= 0 && targetRow < rows) {
                for (let col = 0; col < columns; col++) {
                    let color = getBaseColor(board[targetRow][col].src);
                    if (color) {
                        collectCandy(color, 1);
                    }
                    board[targetRow][col].classList.add("popping");
                    setTimeout(() => {
                        board[targetRow][col].src = "./images/blank.png";
                        board[targetRow][col].classList.remove("popping");
                    }, 400);
                }
            }
        }
    } else {
        // Clear 3 columns
        for (let colOffset = -1; colOffset <= 1; colOffset++) {
            let targetCol = c + colOffset;
            if (targetCol >= 0 && targetCol < columns) {
                for (let row = 0; row < rows; row++) {
                    let color = getBaseColor(board[row][targetCol].src);
                    if (color) {
                        collectCandy(color, 1);
                    }
                    board[row][targetCol].classList.add("popping");
                    setTimeout(() => {
                        board[row][targetCol].src = "./images/blank.png";
                        board[row][targetCol].classList.remove("popping");
                    }, 400);
                }
            }
        }
    }
}

function comboDoubleWrapped(r, c) {
    // 5x5 explosion
    for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
            let newR = r + dr;
            let newC = c + dc;
            if (newR >= 0 && newR < rows && newC >= 0 && newC < columns) {
                let color = getBaseColor(board[newR][newC].src);
                if (color) {
                    collectCandy(color, 1);
                }
                board[newR][newC].classList.add("popping");
                setTimeout(() => {
                    board[newR][newC].src = "./images/blank.png";
                    board[newR][newC].classList.remove("popping");
                }, 400);
            }
        }
    }
}

function comboDoubleStriped(r, c) {
    // Clear entire row AND column
    for (let col = 0; col < columns; col++) {
        let color = getBaseColor(board[r][col].src);
        if (color) {
            collectCandy(color, 1);
        }
        board[r][col].classList.add("popping");
        setTimeout(() => {
            board[r][col].src = "./images/blank.png";
            board[r][col].classList.remove("popping");
        }, 400);
    }
    
    for (let row = 0; row < rows; row++) {
        if (row !== r) {
            let color = getBaseColor(board[row][c].src);
            if (color) {
                collectCandy(color, 1);
            }
            board[row][c].classList.add("popping");
            setTimeout(() => {
                board[row][c].src = "./images/blank.png";
                board[row][c].classList.remove("popping");
            }, 400);
        }
    }
}

function activateHorizontalStriped(tile) {
    let coords = tile.id.split("-");
    let r = parseInt(coords[0]);
    
    // Explode the striped candy itself
    tile.classList.add("exploding");
    
    for (let c = 0; c < columns; c++) {
        let color = getBaseColor(board[r][c].src);
        if (color) {
            collectCandy(color, 1);
        }
        board[r][c].classList.add("striped-blasting");
    }
    
    setTimeout(() => {
        for (let c = 0; c < columns; c++) {
            board[r][c].src = "./images/blank.png";
            board[r][c].classList.remove("striped-blasting");
        }
        tile.classList.remove("exploding");
    }, 500);
}

function activateVerticalStriped(tile) {
    let coords = tile.id.split("-");
    let c = parseInt(coords[1]);
    
    // Explode the striped candy itself
    tile.classList.add("exploding");
    
    for (let r = 0; r < rows; r++) {
        let color = getBaseColor(board[r][c].src);
        if (color) {
            collectCandy(color, 1);
        }
        board[r][c].classList.add("striped-blasting");
    }
    
    setTimeout(() => {
        for (let r = 0; r < rows; r++) {
            board[r][c].src = "./images/blank.png";
            board[r][c].classList.remove("striped-blasting");
        }
        tile.classList.remove("exploding");
    }, 500);
}

function activateWrapped(tile) {
    let coords = tile.id.split("-");
    let r = parseInt(coords[0]);
    let c = parseInt(coords[1]);
    
    // Explode the wrapped candy itself
    tile.classList.add("wrapped-booming");
    
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            let newR = r + dr;
            let newC = c + dc;
            if (newR >= 0 && newR < rows && newC >= 0 && newC < columns) {
                let color = getBaseColor(board[newR][newC].src);
                if (color) {
                    collectCandy(color, 1);
                }
                board[newR][newC].classList.add("popping");
            }
        }
    }
    
    setTimeout(() => {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                let newR = r + dr;
                let newC = c + dc;
                if (newR >= 0 && newR < rows && newC >= 0 && newC < columns) {
                    board[newR][newC].src = "./images/blank.png";
                    board[newR][newC].classList.remove("popping");
                }
            }
        }
        tile.classList.remove("wrapped-booming");
    }, 600);
}

function activateChocolate(tile) {
    let coords = tile.id.split("-");
    let r = parseInt(coords[0]);
    let c = parseInt(coords[1]);
    
    let targetColor = randomCandy();
    let count = 0;
    
    // Chocolate explodes dramatically
    tile.classList.add("choco-bursting");
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            if (board[row][col].src.includes(targetColor + ".png")) {
                board[row][col].classList.add("popping");
                count++;
            }
        }
    }
    
    collectCandy(targetColor, count);
    
    setTimeout(() => {
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
                if (board[row][col].classList.contains("popping")) {
                    board[row][col].src = "./images/blank.png";
                    board[row][col].classList.remove("popping");
                }
            }
        }
        board[r][c].src = "./images/blank.png";
        board[r][c].classList.remove("choco-bursting");
    }, 900);
}

function getBaseColor(src) {
    // Don't match special candies with regular candies
    if (src.includes("Striped") || src.includes("Wrapped") || src.includes("Choco")) {
        return null; // Special candies don't match in normal crush checks
    }
    
    for (let color of candies) {
        if (src.includes(color)) {
            return color;
        }
    }
    return null;
}

function crushCandy() {
    crushWrapped();
    crushFive();
    crushFour();
    crushThree();
}

function crushWrapped() {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            let center = board[r][c];
            let centerColor = getBaseColor(center.src);
            
            if (!centerColor || center.src.includes("blank")) continue;
            
            let foundHorizontal = false;
            let foundVertical = false;
            let horizontalCandies = [];
            let verticalCandies = [];
            
            if (c <= columns - 3) {
                let c1 = getBaseColor(board[r][c].src);
                let c2 = getBaseColor(board[r][c+1].src);
                let c3 = getBaseColor(board[r][c+2].src);
                if (c1 && c1 == c2 && c2 == c3 && c1 == centerColor) {
                    foundHorizontal = true;
                    horizontalCandies = [board[r][c], board[r][c+1], board[r][c+2]];
                }
            }
            if (c >= 1 && c <= columns - 2) {
                let c1 = getBaseColor(board[r][c-1].src);
                let c2 = getBaseColor(board[r][c].src);
                let c3 = getBaseColor(board[r][c+1].src);
                if (c1 && c1 == c2 && c2 == c3 && c1 == centerColor) {
                    foundHorizontal = true;
                    horizontalCandies = [board[r][c-1], board[r][c], board[r][c+1]];
                }
            }
            if (c >= 2) {
                let c1 = getBaseColor(board[r][c-2].src);
                let c2 = getBaseColor(board[r][c-1].src);
                let c3 = getBaseColor(board[r][c].src);
                if (c1 && c1 == c2 && c2 == c3 && c1 == centerColor) {
                    foundHorizontal = true;
                    horizontalCandies = [board[r][c-2], board[r][c-1], board[r][c]];
                }
            }
            
            if (r <= rows - 3) {
                let c1 = getBaseColor(board[r][c].src);
                let c2 = getBaseColor(board[r+1][c].src);
                let c3 = getBaseColor(board[r+2][c].src);
                if (c1 && c1 == c2 && c2 == c3 && c1 == centerColor) {
                    foundVertical = true;
                    verticalCandies = [board[r][c], board[r+1][c], board[r+2][c]];
                }
            }
            if (r >= 1 && r <= rows - 2) {
                let c1 = getBaseColor(board[r-1][c].src);
                let c2 = getBaseColor(board[r][c].src);
                let c3 = getBaseColor(board[r+1][c].src);
                if (c1 && c1 == c2 && c2 == c3 && c1 == centerColor) {
                    foundVertical = true;
                    verticalCandies = [board[r-1][c], board[r][c], board[r+1][c]];
                }
            }
            if (r >= 2) {
                let c1 = getBaseColor(board[r-2][c].src);
                let c2 = getBaseColor(board[r-1][c].src);
                let c3 = getBaseColor(board[r][c].src);
                if (c1 && c1 == c2 && c2 == c3 && c1 == centerColor) {
                    foundVertical = true;
                    verticalCandies = [board[r-2][c], board[r-1][c], board[r][c]];
                }
            }
            
            if (foundHorizontal && foundVertical) {
                collectCandy(centerColor, 5);
                
                for (let candy of horizontalCandies) {
                    candy.src = "./images/blank.png";
                }
                for (let candy of verticalCandies) {
                    candy.src = "./images/blank.png";
                }
                
                // Create wrapped candy and track it
                let specialCandy = centerColor + "-Wrapped";
                board[r][c].src = "./images/" + specialCandy + ".png";
                collectCandy(specialCandy, 1); // Track special candy creation
                return;
            }
        }
    }
}

function crushFive() {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns - 4; c++) {
            let candy1 = board[r][c];
            let candy2 = board[r][c+1];
            let candy3 = board[r][c+2];
            let candy4 = board[r][c+3];
            let candy5 = board[r][c+4];
            
            // Skip if any candy is already special
            if (candy1.src.includes("Striped") || candy1.src.includes("Wrapped") || candy1.src.includes("Choco") ||
                candy2.src.includes("Striped") || candy2.src.includes("Wrapped") || candy2.src.includes("Choco") ||
                candy3.src.includes("Striped") || candy3.src.includes("Wrapped") || candy3.src.includes("Choco") ||
                candy4.src.includes("Striped") || candy4.src.includes("Wrapped") || candy4.src.includes("Choco") ||
                candy5.src.includes("Striped") || candy5.src.includes("Wrapped") || candy5.src.includes("Choco")) {
                continue;
            }
            
            let color1 = getBaseColor(candy1.src);
            let color2 = getBaseColor(candy2.src);
            let color3 = getBaseColor(candy3.src);
            let color4 = getBaseColor(candy4.src);
            let color5 = getBaseColor(candy5.src);
            
            if (color1 && color1 == color2 && color2 == color3 && color3 == color4 && color4 == color5 && !candy1.src.includes("blank")) {
                collectCandy(color1, 5);
                
                candy1.src = "./images/blank.png";
                candy2.src = "./images/blank.png";
                candy3.src = "./images/Choco.png";
                collectCandy("Choco", 1);
                candy4.src = "./images/blank.png";
                candy5.src = "./images/blank.png";
                return;
            }
        }
    }
    
    for (let c = 0; c < columns; c++) {
        for (let r = 0; r < rows - 4; r++) {
            let candy1 = board[r][c];
            let candy2 = board[r+1][c];
            let candy3 = board[r+2][c];
            let candy4 = board[r+3][c];
            let candy5 = board[r+4][c];
            
            // Skip if any candy is already special
            if (candy1.src.includes("Striped") || candy1.src.includes("Wrapped") || candy1.src.includes("Choco") ||
                candy2.src.includes("Striped") || candy2.src.includes("Wrapped") || candy2.src.includes("Choco") ||
                candy3.src.includes("Striped") || candy3.src.includes("Wrapped") || candy3.src.includes("Choco") ||
                candy4.src.includes("Striped") || candy4.src.includes("Wrapped") || candy4.src.includes("Choco") ||
                candy5.src.includes("Striped") || candy5.src.includes("Wrapped") || candy5.src.includes("Choco")) {
                continue;
            }
            
            let color1 = getBaseColor(candy1.src);
            let color2 = getBaseColor(candy2.src);
            let color3 = getBaseColor(candy3.src);
            let color4 = getBaseColor(candy4.src);
            let color5 = getBaseColor(candy5.src);
            
            if (color1 && color1 == color2 && color2 == color3 && color3 == color4 && color4 == color5 && !candy1.src.includes("blank")) {
                collectCandy(color1, 5);
                
                candy1.src = "./images/blank.png";
                candy2.src = "./images/blank.png";
                candy3.src = "./images/Choco.png";
                collectCandy("Choco", 1);
                candy4.src = "./images/blank.png";
                candy5.src = "./images/blank.png";
                return;
            }
        }
    }
}

function crushFour() {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns - 3; c++) {
            let candy1 = board[r][c];
            let candy2 = board[r][c+1];
            let candy3 = board[r][c+2];
            let candy4 = board[r][c+3];
            
            // Skip if any candy is already special
            if (candy1.src.includes("Striped") || candy1.src.includes("Wrapped") || candy1.src.includes("Choco") ||
                candy2.src.includes("Striped") || candy2.src.includes("Wrapped") || candy2.src.includes("Choco") ||
                candy3.src.includes("Striped") || candy3.src.includes("Wrapped") || candy3.src.includes("Choco") ||
                candy4.src.includes("Striped") || candy4.src.includes("Wrapped") || candy4.src.includes("Choco")) {
                continue;
            }
            
            let color1 = getBaseColor(candy1.src);
            let color2 = getBaseColor(candy2.src);
            let color3 = getBaseColor(candy3.src);
            let color4 = getBaseColor(candy4.src);
            
            if (color1 && color1 == color2 && color2 == color3 && color3 == color4 && !candy1.src.includes("blank")) {
                collectCandy(color1, 4);
                
                // Create HORIZONTAL striped candy and track it
                let specialCandy = color1 + "-Striped-Horizontal";
                candy1.src = "./images/" + specialCandy + ".png";
                collectCandy(specialCandy, 1);
                
                candy2.src = "./images/blank.png";
                candy3.src = "./images/blank.png";
                candy4.src = "./images/blank.png";
                return;
            }
        }
    }
    
    for (let c = 0; c < columns; c++) {
        for (let r = 0; r < rows - 3; r++) {
            let candy1 = board[r][c];
            let candy2 = board[r+1][c];
            let candy3 = board[r+2][c];
            let candy4 = board[r+3][c];
            
            // Skip if any candy is already special
            if (candy1.src.includes("Striped") || candy1.src.includes("Wrapped") || candy1.src.includes("Choco") ||
                candy2.src.includes("Striped") || candy2.src.includes("Wrapped") || candy2.src.includes("Choco") ||
                candy3.src.includes("Striped") || candy3.src.includes("Wrapped") || candy3.src.includes("Choco") ||
                candy4.src.includes("Striped") || candy4.src.includes("Wrapped") || candy4.src.includes("Choco")) {
                continue;
            }
            
            let color1 = getBaseColor(candy1.src);
            let color2 = getBaseColor(candy2.src);
            let color3 = getBaseColor(candy3.src);
            let color4 = getBaseColor(candy4.src);
            
            if (color1 && color1 == color2 && color2 == color3 && color3 == color4 && !candy1.src.includes("blank")) {
                collectCandy(color1, 4);
                
                // Create VERTICAL striped candy and track it
                let specialCandy = color1 + "-Striped-Vertical";
                candy1.src = "./images/" + specialCandy + ".png";
                collectCandy(specialCandy, 1);
                
                candy2.src = "./images/blank.png";
                candy3.src = "./images/blank.png";
                candy4.src = "./images/blank.png";
                return;
            }
        }
    }
}

function crushThree() {
    // Check rows
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns - 2; c++) {
            let candy1 = board[r][c];
            let candy2 = board[r][c+1];
            let candy3 = board[r][c+2];
            
            // Skip if any candy is special
            if (candy1.src.includes("Striped") || candy1.src.includes("Wrapped") || candy1.src.includes("Choco") ||
                candy2.src.includes("Striped") || candy2.src.includes("Wrapped") || candy2.src.includes("Choco") ||
                candy3.src.includes("Striped") || candy3.src.includes("Wrapped") || candy3.src.includes("Choco")) {
                continue;
            }
            
            let color1 = getBaseColor(candy1.src);
            let color2 = getBaseColor(candy2.src);
            let color3 = getBaseColor(candy3.src);
            
            if (color1 && color1 == color2 && color2 == color3 && !candy1.src.includes("blank")) {
                collectCandy(color1, 3);
                
                // Add pop animation and clear immediately
                candy1.classList.add("popping");
                candy2.classList.add("popping");
                candy3.classList.add("popping");
                
                // Clear immediately - animation is visual only
                candy1.src = "./images/blank.png";
                candy2.src = "./images/blank.png";
                candy3.src = "./images/blank.png";
                
                // Remove animation class after animation finishes
                setTimeout(() => {
                    candy1.classList.remove("popping");
                    candy2.classList.remove("popping");
                    candy3.classList.remove("popping");
                }, 400);
            }
        }
    }

    // Check columns
    for (let c = 0; c < columns; c++) {
        for (let r = 0; r < rows - 2; r++) {
            let candy1 = board[r][c];
            let candy2 = board[r+1][c];
            let candy3 = board[r+2][c];
            
            // Skip if any candy is special
            if (candy1.src.includes("Striped") || candy1.src.includes("Wrapped") || candy1.src.includes("Choco") ||
                candy2.src.includes("Striped") || candy2.src.includes("Wrapped") || candy2.src.includes("Choco") ||
                candy3.src.includes("Striped") || candy3.src.includes("Wrapped") || candy3.src.includes("Choco")) {
                continue;
            }
            
            let color1 = getBaseColor(candy1.src);
            let color2 = getBaseColor(candy2.src);
            let color3 = getBaseColor(candy3.src);
            
            if (color1 && color1 == color2 && color2 == color3 && !candy1.src.includes("blank")) {
                collectCandy(color1, 3);
                
                // Add pop animation and clear immediately
                candy1.classList.add("popping");
                candy2.classList.add("popping");
                candy3.classList.add("popping");
                
                // Clear immediately - animation is visual only
                candy1.src = "./images/blank.png";
                candy2.src = "./images/blank.png";
                candy3.src = "./images/blank.png";
                
                // Remove animation class after animation finishes
                setTimeout(() => {
                    candy1.classList.remove("popping");
                    candy2.classList.remove("popping");
                    candy3.classList.remove("popping");
                }, 400);
            }
        }
    }
}

function checkValid() {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns - 2; c++) {
            let candy1 = board[r][c];
            let candy2 = board[r][c+1];
            let candy3 = board[r][c+2];
            
            let color1 = getBaseColor(candy1.src);
            let color2 = getBaseColor(candy2.src);
            let color3 = getBaseColor(candy3.src);
            
            if (color1 && color1 == color2 && color2 == color3 && !candy1.src.includes("blank")) {
                return true;
            }
        }
    }

    for (let c = 0; c < columns; c++) {
        for (let r = 0; r < rows - 2; r++) {
            let candy1 = board[r][c];
            let candy2 = board[r+1][c];
            let candy3 = board[r+2][c];
            
            let color1 = getBaseColor(candy1.src);
            let color2 = getBaseColor(candy2.src);
            let color3 = getBaseColor(candy3.src);
            
            if (color1 && color1 == color2 && color2 == color3 && !candy1.src.includes("blank")) {
                return true;
            }
        }
    }

    return false;
}

function slideCandy() {
    for (let c = 0; c < columns; c++) {
        let ind = rows - 1;
        for (let r = rows - 1; r >= 0; r--) {
            if (!board[r][c].src.includes("blank")) {
                // Only move if target position is different
                if (ind !== r) {
                    board[ind][c].src = board[r][c].src;
                    board[r][c].src = "./images/blank.png";
                }
                ind -= 1;
            }
        }
    }
}

function generateCandy() {
    for (let c = 0; c < columns; c++) {
        if (board[0][c].src.includes("blank")) {
            board[0][c].src = "./images/" + randomCandy() + ".png";
            board[0][c].classList.add("falling");
            setTimeout(() => {
                board[0][c].classList.remove("falling");
            }, 500);
        }
    }
}

// ===== ORDER TRAY SYSTEM =====

// Initialize order tray with 1-3 random special candies
function updateOrderTray() {
    let trayContainer = document.getElementById("tray-candies");
    trayContainer.innerHTML = "";
    
    // Random number of special candies (1-3)
    let numSpecials = Math.floor(Math.random() * 3) + 1;
    orderTraySpecials = [];
    
    for (let i = 0; i < numSpecials; i++) {
        let randomSpecial = specialCandyTypes[Math.floor(Math.random() * specialCandyTypes.length)];
        orderTraySpecials.push(randomSpecial);
        
        let candyImg = document.createElement("img");
        candyImg.src = "./images/" + randomSpecial + ".png";
        candyImg.alt = randomSpecial;
        trayContainer.appendChild(candyImg);
    }
}

// Update progress bar
function updateProgressBar() {
    let percentage = (candiesDestroyed % 100) / 100 * 100;
    let progressFill = document.getElementById("order-progress-fill");
    let progressText = document.getElementById("order-progress-text");
    
    progressFill.style.width = percentage + "%";
    progressText.innerText = (candiesDestroyed % 100) + "/100";
    
    // Check if reached 100 candies
    if (candiesDestroyed > 0 && candiesDestroyed % 100 === 0) {
        deliverOrderTray();
    }
}

// When 100 candies destroyed, shake tray and launch specials onto board
function deliverOrderTray() {
    let tray = document.getElementById("order-tray");
    
    // Shake animation
    tray.classList.add("shaking");
    setTimeout(() => {
        tray.classList.remove("shaking");
    }, 500);
    
    // Launch each special candy after shake
    setTimeout(() => {
        launchSpecialCandies();
    }, 600);
}

// Launch special candies from tray to random board positions
function launchSpecialCandies() {
    orderTraySpecials.forEach((specialType, index) => {
        setTimeout(() => {
            // Find random empty or regular candy position
            let placed = false;
            let attempts = 0;
            
            while (!placed && attempts < 50) {
                let r = Math.floor(Math.random() * rows);
                let c = Math.floor(Math.random() * columns);
                
                // Don't replace existing special candies
                if (!board[r][c].src.includes("Striped") && 
                    !board[r][c].src.includes("Wrapped") && 
                    !board[r][c].src.includes("Choco")) {
                    
                    // Replace with special candy
                    board[r][c].src = "./images/" + specialType + ".png";
                    
                    // Add visual effect
                    board[r][c].classList.add("exploding");
                    setTimeout(() => {
                        board[r][c].classList.remove("exploding");
                    }, 800);
                    
                    placed = true;
                }
                attempts++;
            }
        }, index * 200); // Stagger launches
    });
    
    // Generate new tray after all launched
    setTimeout(() => {
        updateOrderTray();
    }, orderTraySpecials.length * 200 + 500);
}

// Track destroyed candies and update progress
function trackDestroyedCandy() {
    candiesDestroyed++;
    updateProgressBar();
}

// Check if player ran out of moves
function checkMovesRemaining() {
    if (moves <= 0 && !gameOver) {
        gameOver = true;
        document.getElementById("message").innerText = "Out of Moves! Restarting Level...";
        
        setTimeout(() => {
            document.getElementById("message").innerText = "";
            gameOver = false;
            moves = maxMoves;
            candiesDestroyed = 0;
            setupLevel();
        }, 2000);
    }
}
