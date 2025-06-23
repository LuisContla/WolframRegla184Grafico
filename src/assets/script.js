window.onload = function () {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const aliveImage1 = new Image();
    aliveImage1.src = "./Media/CarEast.png";
    const aliveImage2 = new Image();
    aliveImage2.src = "./Media/CarWest.png";
    const damagedImage1 = new Image();
    damagedImage1.src = "./Media/CarEastBroken.png";
    const damagedImage2 = new Image();
    damagedImage2.src = "./Media/CarWestBroken.png";

    let rows = 10, cols = 50;
    let cellSize = 30;
    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;

    // Cambia estos valores para elegir las filas de los carriles
    let rowRight = 4; // Fila que avanza a la derecha (de izquierda a derecha)
    let rowLeft = 5;  // Fila que avanza a la izquierda (de derecha a izquierda)

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

    let breakdownProbability = 0.01;
    let repairProbability = 0.5;
    let laneChangeProbability = 0.1;

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

                // Dibuja el carro funcional o averiado
                const cell = grid[y][x];
                if (y === rowRight) {
                    if (cell === 1) {
                        ctx.drawImage(aliveImage1, x * cellSize, y * cellSize, cellSize, cellSize);
                    } else if (typeof cell === "object" && cell.state === "damaged") {
                        ctx.drawImage(damagedImage1, x * cellSize, y * cellSize, cellSize, cellSize);
                    }
                } else if (y === rowLeft) {
                    if (cell === 1) {
                        ctx.drawImage(aliveImage2, x * cellSize, y * cellSize, cellSize, cellSize);
                    } else if (typeof cell === "object" && cell.state === "damaged") {
                        ctx.drawImage(damagedImage2, x * cellSize, y * cellSize, cellSize, cellSize);
                    }
                }

                ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }
    }

    function applyRule184(prevRow, skipIndices = []) {
        const nextRow = new Array(cols).fill(0);
        const processed = new Array(cols).fill(false);

        for (let i = cols - 1; i >= 0; i--) {
            if (skipIndices.includes(i) || processed[i]) {
                nextRow[i] = prevRow[i];
                continue;
            }

            const center = prevRow[i];
            const rightIdx = (i + 1) % cols;
            const right = prevRow[rightIdx];

            // Si ya era averiado
            if (typeof center === "object" && center.state === "damaged") {
                const newTimer = center.timer - 1;
                nextRow[i] = newTimer > 0
                    ? { state: "damaged", timer: newTimer }
                    : (Math.random() < repairProbability ? 1 : 0);
                processed[i] = true;
                continue;
            }

            // Si es funcional, primero determinamos si se avería
            if (center === 1 && Math.random() < breakdownProbability) {
                nextRow[i] = { state: "damaged", timer: 20 };
                processed[i] = true;
                continue; // No avanza si se avería
            }

            // Avanza solo si la celda destino está vacía y no ha sido procesada
            if (
                center === 1 &&
                right === 0 &&
                nextRow[rightIdx] === 0 &&
                !processed[rightIdx]
            ) {
                nextRow[rightIdx] = 1;
                processed[rightIdx] = true;
            } else if (
                center === 1 &&
                (typeof right === "object" && right.state === "damaged")
            ) {
                nextRow[i] = 1;
                processed[i] = true;
            } else if (center === 1) {
                nextRow[i] = 1;
                processed[i] = true;
            }
        }

        return nextRow;
    }

    function applyRule184Reversed(prevRow, skipIndices = []) {
        const nextRow = new Array(cols).fill(0);
        const processed = new Array(cols).fill(false);

        for (let i = 0; i < cols; i++) {
            if (skipIndices.includes(i) || processed[i]) {
                nextRow[i] = prevRow[i];
                continue;
            }

            const center = prevRow[i];
            const leftIdx = (i - 1 + cols) % cols;
            const left = prevRow[leftIdx];

            // Si ya era averiado
            if (typeof center === "object" && center.state === "damaged") {
                const newTimer = center.timer - 1;
                nextRow[i] = newTimer > 0
                    ? { state: "damaged", timer: newTimer }
                    : (Math.random() < repairProbability ? 1 : 0);
                processed[i] = true;
                continue;
            }

            // Si es funcional, primero determinamos si se avería
            if (center === 1 && Math.random() < breakdownProbability) {
                nextRow[i] = { state: "damaged", timer: 20 };
                processed[i] = true;
                continue; // No avanza si se avería
            }

            // Avanza solo si la celda destino está vacía y no ha sido procesada
            if (
                center === 1 &&
                left === 0 &&
                nextRow[leftIdx] === 0 &&
                !processed[leftIdx]
            ) {
                nextRow[leftIdx] = 1;
                processed[leftIdx] = true;
            } else if (
                center === 1 &&
                (typeof left === "object" && left.state === "damaged")
            ) {
                nextRow[i] = 1;
                processed[i] = true;
            } else if (center === 1) {
                nextRow[i] = 1;
                processed[i] = true;
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

    function stepSimulation() {
        let newGrid = grid.map(row => [...row]);
        let flashes = [];
        let skipRight = [];
        let skipLeft = [];

        // --- PROCESO DE AVERÍA Y CAMBIO DE CARRIL ---
        // Copias para saber si ya se cambió de carril en este paso
        let tempRowRight = [...newGrid[rowRight]];
        let tempRowLeft = [...newGrid[rowLeft]];
        let nextRowRight = Array(cols).fill(0);
        let nextRowLeft = Array(cols).fill(0);

        // Primero: avería y cambio de carril para ambos carriles
        for (let i = 0; i < cols; i++) {
            // --- Carril superior (derecha) ---
            if (tempRowRight[i] === 1) {
                // 1. Avería
                if (Math.random() < breakdownProbability) {
                    nextRowRight[i] = { state: "damaged", timer: 20 };
                    continue;
                }
                // 2. Cambio de carril (solo si celda de abajo está libre)
                if (
                    Math.random() < laneChangeProbability &&
                    tempRowLeft[i] === 0 &&
                    nextRowLeft[i] === 0
                ) {
                    nextRowLeft[i] = 1;
                    continue;
                }
                // 3. Si no cambia de carril ni se avería, queda para avanzar
                nextRowRight[i] = 1;
            } else if (typeof tempRowRight[i] === "object" && tempRowRight[i].state === "damaged") {
                // Mantén los averiados para el procesamiento de timer
                nextRowRight[i] = tempRowRight[i];
            }

            // --- Carril inferior (izquierda) ---
            if (tempRowLeft[i] === 1) {
                // 1. Avería
                if (Math.random() < breakdownProbability) {
                    nextRowLeft[i] = { state: "damaged", timer: 20 };
                    continue;
                }
                // 2. Cambio de carril (solo si celda de arriba está libre)
                if (
                    Math.random() < laneChangeProbability &&
                    tempRowRight[i] === 0 &&
                    nextRowRight[i] === 0
                ) {
                    nextRowRight[i] = 1;
                    continue;
                }
                // 3. Si no cambia de carril ni se avería, queda para avanzar
                nextRowLeft[i] = 1;
            } else if (typeof tempRowLeft[i] === "object" && tempRowLeft[i].state === "damaged") {
                // Mantén los averiados para el procesamiento de timer
                nextRowLeft[i] = tempRowLeft[i];
            }
        }

        // Ahora nextRowRight y nextRowLeft tienen los carros listos para avanzar (o averiados)
        // Aplica la regla 184 solo a los carros funcionales (1), saltando los averiados y los que cambiaron de carril
        newGrid[rowRight] = applyRule184(nextRowRight, skipRight);
        newGrid[rowLeft] = applyRule184Reversed(nextRowLeft, skipLeft);

        // --- El resto de tu función stepSimulation sigue igual ---
        // Tráfico continuo después del avance
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
            setProbabilityInputsEnabled(false); // Deshabilita los inputs
            interval = setInterval(stepSimulation, speed);
        } else {
            running = false;
            startButton.textContent = "Iniciar";
            setProbabilityInputsEnabled(true); // Habilita los inputs
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
        setProbabilityInputsEnabled(true);
        drawGrid();
    }

    function setupCanvasInteraction() {
        let isDrawing = false;
        let drawState = null;
        let drawRow = null;

        canvas.addEventListener("mousedown", (event) => {
            const { x, y } = getCellFromEvent(canvas, event);
            if (y !== rowRight && y !== rowLeft) return; // Solo carriles
            if (running) toggleGame();

            // Cicla los estados: vacío -> funcional -> averiado -> vacío ...
            const cell = grid[y][x];
            if (cell === 0) {
                grid[y][x] = 1; // Funcional
            } else if (cell === 1) {
                grid[y][x] = { state: "damaged", timer: 20 }; // Averiado
            } else if (typeof cell === "object" && cell.state === "damaged") {
                grid[y][x] = 0; // Vacío
            }
            drawGrid();
        });

        canvas.addEventListener("mousemove", (event) => {
            if (!isDrawing) return;
            const { x, y } = getCellFromEvent(canvas, event);
            if (y !== drawRow) return;
            if (event.shiftKey) {
                grid[y][x] = { state: "damaged", timer: 20 };
            } else if (grid[y][x] !== drawState) {
                grid[y][x] = drawState;
            }
            drawGrid();
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

    function setProbabilityInputsEnabled(enabled) {
        document.getElementById("breakdownInput").disabled = !enabled;
        document.getElementById("repairInput").disabled = !enabled;
        document.getElementById("laneChangeInput").disabled = !enabled;
    }

    document.getElementById("breakdownInput").addEventListener("input", function () {
        breakdownProbability = parseFloat(this.value);
    });
    document.getElementById("repairInput").addEventListener("input", function () {
        repairProbability = parseFloat(this.value);
    });
    document.getElementById("laneChangeInput").addEventListener("input", function () {
        laneChangeProbability = parseFloat(this.value);
    });

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