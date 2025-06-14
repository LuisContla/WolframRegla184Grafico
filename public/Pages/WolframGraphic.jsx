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
            <canvas id="gameCanvas1" />
            <canvas id="gameCanvas2" />
            <br /><br />
          </div>
        </div>
        <div className="botones">
          <button id="startButton">Iniciar</button>
          <button id="resetButton">Reiniciar</button>
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