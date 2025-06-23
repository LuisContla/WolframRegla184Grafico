import "../../src/assets/script.js";

function WolframGraphic() {
  return (
    <>
      <div className="contenedor-principal">
        <div className="encabezado">
          <div className="titulo">
            <h2>Regla 184 Wolfram ejemplificación</h2>
          </div>
        </div>
        <div className="simulacion">
          <div className="canvas">
            <canvas id="gameCanvas" />
            <br /><br />
          </div>
        </div>
        <div className="botones">
          <button id="startButton">Iniciar</button>
          <button id="resetButton">Reiniciar</button>
          <button id="toggleCyclic">Modo Cíclico: OFF</button>
          <button id="toggleContinuous">Tráfico Continuo: OFF</button>
        </div>
        <div className="control-de-celulas">
          <label>Densidad:</label>
          <button id="decreaseDensity10">--</button>
          <button id="decreaseDensity">-</button>
          <input id="densityInput" type="number" min="0" max="1" step="0.01" defaultValue="0.5" readOnly />
          <button id="increaseDensity">+</button>
          <button id="increaseDensity10">++</button>
          <button id="randomButton">Aleatorio</button>
        </div>
        <div className="probabilidades">
          <label>
            Probabilidad de avería:
            <input id="breakdownInput" type="number" min="0" max="1" step="0.01" defaultValue="0.01" />
          </label>
          <label style={{ marginLeft: "1em" }}>
            Probabilidad de reparación:
            <input id="repairInput" type="number" min="0" max="1" step="0.01" defaultValue="0.5" />
          </label>
          <label style={{ marginLeft: "1em" }}>
            Probabilidad de cambio de carril:
            <input id="laneChangeInput" type="number" min="0" max="1" step="0.01" defaultValue="0.1" />
          </label>
        </div>
        <div className="velocidad">
          <label>Velocidad (ms):</label>
          <button id="increaseSpeed">-</button>
          <input id="speedInput" type="number" defaultValue="1000" readOnly />
          <button id="decreaseSpeed">+</button>
        </div>
        <div className="estadisticas">
          <p>Paso actual: <span id="stepCount">0</span></p>
        </div>
      </div>
    </>

  )
}

export default WolframGraphic