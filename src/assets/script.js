window.onload = function () {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const aliveImage1 = new Image();
    aliveImage1.src = "./Media/CarEast.png";
    const aliveImage2 = new Image();
    aliveImage2.src = "./Media/CarWest.png";

    let rows = 10, cols = 50;
    let cellSize = 30;
    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;

    // Cambia estos valores para elegir las filas de los carriles
    let rowRight = 3; // Fila que avanza a la derecha (de izquierda a derecha)
    let rowLeft = 6;  // Fila que avanza a la izquierda (de derecha a izquierda)

    let grid = Array.from({ length: rows }, () => Array(cols).fill(0));
    let transferFlash = [];

    let currentRow = 0;
    let running = false;
    let interval = null;
    let speed = 1000;
    let density = 0.5;
    let cyclicMode = false;
    let continuousTraffic = false;

    const minSpeed = 250;
    const maxSpeed = 1000;
    const speedStep = 250;

    function drawGrid() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                // ¿Hay destello en esta celda?
                const isFlash = transferFlash.some(f => f.row === y && f.col === x);
                if (isFlash) {
                    ctx.fillStyle = "#ffff00"; // Amarillo para el destello
                } else if (y === rowRight) {
                    ctx.fillStyle = "#e0f7fa";
                } else if (y === rowLeft) {
                    ctx.fillStyle = "#ffe0b2";
                } else {
                    ctx.fillStyle = "white";
                }
                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

                if (y === rowRight && grid[y][x] === 1) {
                    ctx.drawImage(aliveImage1, x * cellSize, y * cellSize, cellSize, cellSize);
                } else if (y === rowLeft && grid[y][x] === 1) {
                    ctx.drawImage(aliveImage2, x * cellSize, y * cellSize, cellSize, cellSize);
                }

                ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }
    }

    function applyRule184(prevRow, skipIndices = []) {
        const nextRow = new Array(cols).fill(0);
        for (let i = 0; i < cols; i++) {
            if (skipIndices.includes(i)) continue;
            const left = prevRow[(i - 1 + cols) % cols];
            const center = prevRow[i];
            const right = prevRow[(i + 1) % cols];

            if (center === 1 && right === 0) {
                nextRow[(i + 1) % cols] = 1;
            } else if (center === 1 && right === 1) {
                nextRow[i] = 1;
            } else if (center === 0 && left === 1) {
                nextRow[i] = 1;
            }
        }
        return nextRow;
    }

    function applyRule184Reversed(prevRow, skipIndices = []) {
        const nextRow = new Array(cols).fill(0);
        for (let i = cols - 1; i >= 0; i--) {
            if (skipIndices.includes(i)) continue;
            const right = prevRow[(i - 1 + cols) % cols];
            const center = prevRow[i];
            const left = prevRow[(i + 1) % cols];

            if (center === 1 && right === 0) {
                nextRow[(i - 1 + cols) % cols] = 1;
            } else if (center === 1 && right === 1) {
                nextRow[i] = 1;
            } else if (center === 0 && left === 1) {
                nextRow[i] = 1;
            }
        }
        return nextRow;
    }

    function addContinuousTraffic() {
        // Carril derecha a izquierda (rowRight, col 0)
        if (Math.random() < density && grid[rowRight][0] === 0) {
            grid[rowRight][0] = 1;
        }
        // Carril izquierda a derecha (rowLeft, col cols-1)
        if (Math.random() < density && grid[rowLeft][cols - 1] === 0) {
            grid[rowLeft][cols - 1] = 1;
        }
    }

    function handleTransfer(grid, rowRight, rowLeft, cols, cyclicMode) {
        let flashes = [];
        let skipRight = [];
        let skipLeft = [];
        let newGrid = grid.map(row => [...row]);

        if (cyclicMode) {
            // De rowRight (derecha) a rowLeft (izquierda)
            if (
                grid[rowRight][cols - 1] === 1 &&
                grid[rowLeft][cols - 1] === 0
            ) {
                newGrid[rowRight][cols - 1] = 0;
                newGrid[rowLeft][cols - 1] = 1;
                flashes.push({ row: rowLeft, col: cols - 1 });
            }
            // De rowLeft (izquierda) a rowRight (derecha)
            if (
                grid[rowLeft][0] === 1 &&
                grid[rowRight][0] === 0
            ) {
                newGrid[rowLeft][0] = 0;
                newGrid[rowRight][0] = 1;
                flashes.push({ row: rowRight, col: 0 });
            }
        }

        return { newGrid, skipRight, skipLeft, flashes };
    }

    function stepSimulation() {
        let newGrid = grid.map(row => [...row]);
        let flashes = [];
        let skipRight = [];
        let skipLeft = [];

        if (cyclicMode) {
            // Transferencia de rowLeft (6,0) a rowRight (3,0) SOLO si 3,0 y 3,1 están vacías (regla 184)
            if (
                grid[rowLeft][0] === 1 &&
                grid[rowRight][0] === 0
            ) {
                newGrid[rowLeft][0] = 0;
                newGrid[rowRight][0] = 1;
                skipLeft.push(0); // Nadie puede avanzar a 6,0 este turno
                flashes.push({ row: rowRight, col: 0 });
            }
            // Transferencia de rowRight (3,cols-1) a rowLeft (6,cols-1) SOLO si 6,cols-1 y 6,cols-2 están vacías (regla 184 reversa)
            if (
                grid[rowRight][cols - 1] === 1 &&
                grid[rowLeft][cols - 1] === 0
            ) {
                newGrid[rowRight][cols - 1] = 0;
                newGrid[rowLeft][cols - 1] = 1;
                skipRight.push(cols - 1); // Nadie puede avanzar a 3,cols-1 este turno
                flashes.push({ row: rowLeft, col: cols - 1 });
            }
        }

        // Aplica la regla 184 normal a ambos carriles, saltando las celdas de transferencia
        newGrid[rowRight] = applyRule184(newGrid[rowRight], skipRight);
        newGrid[rowLeft] = applyRule184Reversed(newGrid[rowLeft], skipLeft);

        if (continuousTraffic) {
            if (Math.random() < density && newGrid[rowRight][0] === 0) {
                newGrid[rowRight][0] = 1;
            }
            if (Math.random() < density && newGrid[rowLeft][cols - 1] === 0) {
                newGrid[rowLeft][cols - 1] = 1;
            }
        }

        grid = newGrid;
        currentRow++;
        document.getElementById("stepCount").textContent = currentRow;

        // Flashes visuales
        if (flashes.length > 0) {
            transferFlash = flashes;
            drawGrid();
            setTimeout(() => {
                transferFlash = [];
                drawGrid();
            }, 150);
        } else {
            transferFlash = [];
            drawGrid();
        }
    }

    function toggleGame() {
        const startButton = document.getElementById("startButton");
        if (!running) {
            running = true;
            startButton.textContent = "Pausar";
            interval = setInterval(stepSimulation, speed);
        } else {
            running = false;
            startButton.textContent = "Iniciar";
            clearInterval(interval);
        }
    }

    function resetGame() {
        grid = Array.from({ length: rows }, () => Array(cols).fill(0));
        currentRow = 0;
        cyclicMode = false;
        continuousTraffic = false;
        document.getElementById("stepCount").textContent = 0;
        document.getElementById("startButton").textContent = "Iniciar";
        document.getElementById("toggleCyclic").textContent = "Modo Cíclico: OFF";
        document.getElementById("toggleContinuous").textContent = "Tráfico Continuo: OFF";
    }

    function setupCanvasInteraction() {
        let isDrawing = false;
        let drawState = null;
        let drawRow = null;

        canvas.addEventListener("mousedown", (event) => {
            const { x, y } = getCellFromEvent(canvas, event);
            if (y !== rowRight && y !== rowLeft) return; // Solo carriles
            if (running) toggleGame();
            isDrawing = true;
            drawRow = y;
            drawState = grid[y][x] === 1 ? 0 : 1;
            grid[y][x] = drawState;
            drawGrid();
        });

        canvas.addEventListener("mousemove", (event) => {
            if (!isDrawing) return;
            const { x, y } = getCellFromEvent(canvas, event);
            if (y !== drawRow) return;
            if (grid[y][x] !== drawState) {
                grid[y][x] = drawState;
                drawGrid();
            }
        });

        canvas.addEventListener("mouseup", () => { isDrawing = false; });
        canvas.addEventListener("mouseleave", () => { isDrawing = false; });
    }

    function getCellFromEvent(canvas, event) {
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) / cellSize);
        const y = Math.floor((event.clientY - rect.top) / cellSize);
        return { x, y };
    }

    document.getElementById("startButton").addEventListener("click", () => toggleGame());

    document.getElementById("resetButton").onclick = () => {
        running = false;
        clearInterval(interval);
        resetGame();
    };

    document.getElementById("randomButton").onclick = () => {
        grid[rowRight] = Array.from({ length: cols }, () => Math.random() < density ? 1 : 0);
        grid[rowLeft] = Array.from({ length: cols }, () => Math.random() < density ? 1 : 0);
        currentRow = 0;
        document.getElementById("stepCount").textContent = 0;
        drawGrid();
    };

    document.getElementById("decreaseSpeed").onclick = () => {
        if (speed < maxSpeed) {
            speed += speedStep;
            document.getElementById("speedInput").value = speed;
            if (running) {
                clearInterval(interval);
                interval = setInterval(stepSimulation, speed);
            }
        }
    };

    document.getElementById("increaseSpeed").onclick = () => {
        if (speed > minSpeed) {
            speed -= speedStep;
            document.getElementById("speedInput").value = speed;
            if (running) {
                clearInterval(interval);
                interval = setInterval(stepSimulation, speed);
            }
        }
    };

    document.getElementById("increaseDensity").onclick = () => {
        if (density < 1) {
            density = Math.min(1, density + 0.01);
            document.getElementById("densityInput").value = density.toFixed(2);
        }
    };

    document.getElementById("decreaseDensity").onclick = () => {
        if (density > 0) {
            density = Math.max(0, density - 0.01);
            document.getElementById("densityInput").value = density.toFixed(2);
        }
    };

    document.getElementById("increaseDensity10").onclick = () => {
        if (density < 1) {
            density = Math.min(1, density + 0.10);
            document.getElementById("densityInput").value = density.toFixed(2);
        }
    };

    document.getElementById("decreaseDensity10").onclick = () => {
        if (density > 0) {
            density = Math.max(0, density - 0.10);
            document.getElementById("densityInput").value = density.toFixed(2);
        }
    };

    document.getElementById("toggleCyclic").onclick = () => {
        cyclicMode = !cyclicMode;
        document.getElementById("toggleCyclic").textContent = `Modo Cíclico: ${cyclicMode ? "ON" : "OFF"}`;
        console.log("Modo cíclico:", cyclicMode);
    };

    document.getElementById("toggleContinuous").onclick = () => {
        continuousTraffic = !continuousTraffic;
        document.getElementById("toggleContinuous").textContent =
            `Tráfico Continuo: ${continuousTraffic ? "ON" : "OFF"}`;
    };

    aliveImage1.onload = () => drawGrid();
    setupCanvasInteraction();
    document.getElementById("speedInput").value = speed;
    document.getElementById("densityInput").value = density.toFixed(2);
    drawGrid();
};