window.onload = function () {
    const canvas1 = document.getElementById("gameCanvas1");
    const canvas2 = document.getElementById("gameCanvas2");
    const ctx1 = canvas1.getContext("2d");
    const ctx2 = canvas2.getContext("2d");
    const aliveImage1 = new Image();
    aliveImage1.src = "./Media/CarEast.png";
    const aliveImage2 = new Image();
    aliveImage2.src = "./Media/CarWest.png";

    let rows = 1, cols = 50;
    let cellSize = 30;
    canvas1.width = cols * cellSize;
    canvas1.height = rows * cellSize;
    canvas2.width = cols * cellSize;
    canvas2.height = rows * cellSize;

    let grid1 = Array.from({ length: rows }, () => Array(cols).fill(0));
    let grid2 = Array.from({ length: rows }, () => Array(cols).fill(0));

    let currentRow = 0;
    let running = false;
    let interval = null;
    let speed = 1000;
    let density = 0.5;

    const minSpeed = 250;
    const maxSpeed = 1000;
    const speedStep = 250;

    function drawGrid() {
        const deadColor = "white";
        ctx1.clearRect(0, 0, canvas1.width, canvas1.height);
        ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (grid1[y][x] === 1) {
                    ctx1.drawImage(aliveImage1, x * cellSize, y * cellSize, cellSize, cellSize);
                } else {
                    ctx1.fillStyle = deadColor;
                    ctx1.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                }
                ctx1.strokeStyle = "gray";
                ctx1.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (grid2[y][x] === 1) {
                    ctx2.drawImage(aliveImage2, x * cellSize, y * cellSize, cellSize, cellSize);
                } else {
                    ctx2.fillStyle = "white";
                    ctx2.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                }
                ctx2.strokeStyle = "gray";
                ctx2.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }

    }

    function applyRule184(prevRow) {
        const nextRow = new Array(cols).fill(0);
        for (let i = 0; i < cols; i++) {
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

    function applyRule184Reversed(prevRow) {
        const nextRow = new Array(cols).fill(0);
        for (let i = 0; i < cols; i++) {
            const right = prevRow[(i - 1 + cols) % cols]; // derecha ahora es izquierda
            const center = prevRow[i];
            const left = prevRow[(i + 1) % cols];         // izquierda ahora es derecha

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

    function stepSimulation() {
        const newRow1 = applyRule184(grid1[0]);
        const newRow2 = applyRule184Reversed(grid2[0]);
        grid1[0] = newRow1;
        grid2[0] = newRow2;
        currentRow++;
        document.getElementById("stepCount").textContent = currentRow;
        drawGrid();
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
        grid1 = Array.from({ length: rows }, () => Array(cols).fill(0));
        grid2 = Array.from({ length: rows }, () => Array(cols).fill(0));
        currentRow = 0;
        document.getElementById("stepCount").textContent = 0;
        drawGrid();
    }

    function setupCanvasInteraction() {
        let isDrawing = false;
        let drawState = null;

        canvas1.addEventListener("mousedown", (event) => {
            if (running) toggleGame();
            isDrawing = true;
            const { x } = getCellFromEvent(canvas1, event);
            drawState = grid1[0][x] === 1 ? 0 : 1;
            grid1[0][x] = drawState;
            drawGrid();
        });

        canvas1.addEventListener("mousemove", (event) => {
            if (!isDrawing) return;
            const { x } = getCellFromEvent(canvas1, event);
            if (grid1[0][x] !== drawState) {
                grid1[0][x] = drawState;
                drawGrid();
            }
        });

        canvas1.addEventListener("mouseup", () => { isDrawing = false; });
        canvas1.addEventListener("mouseleave", () => { isDrawing = false; });

        canvas2.addEventListener("mousedown", (event) => {
            if (running) toggleGame();
            isDrawing = true;
            const { x } = getCellFromEvent(canvas2, event);
            drawState = grid2[0][x] === 1 ? 0 : 1;
            grid2[0][x] = drawState;
            drawGrid();
        });

        canvas2.addEventListener("mousemove", (event) => {
            if (!isDrawing) return;
            const { x } = getCellFromEvent(canvas2, event);
            if (grid2[0][x] !== drawState) {
                grid2[0][x] = drawState;
                drawGrid();
            }
        });

        canvas2.addEventListener("mouseup", () => { isDrawing = false; });
        canvas2.addEventListener("mouseleave", () => { isDrawing = false; });
    }

    function getCellFromEvent(canvas, event) {
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) / cellSize);
        return { x };
    }

    document.getElementById("startButton").addEventListener("click", () => toggleGame());

    document.getElementById("resetButton").onclick = () => {
        running = false;
        clearInterval(interval);
        resetGame();
    };

    document.getElementById("randomButton").onclick = () => {
        grid1[0] = Array.from({ length: cols }, () => Math.random() < density ? 1 : 0);
        grid2[0] = Array.from({ length: cols }, () => Math.random() < density ? 1 : 0);
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

    aliveImage1.onload = () => drawGrid();
    setupCanvasInteraction();
    document.getElementById("speedInput").value = speed;
    document.getElementById("densityInput").value = density.toFixed(2);
};
