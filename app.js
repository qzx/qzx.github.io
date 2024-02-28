// app.js
const MyApp = (() => {
    const go = new Go();

    async function init() {
        const resp = await fetch('main.wasm');
        const buffer = await resp.arrayBuffer();
        const {instance} = await WebAssembly.instantiate(buffer, go.importObject);
        go.run(instance);
    }

    function callGoFunctionz() {
        const result = callGoFunction(); // Make sure to access exported functions correctly.
        document.getElementById('result').textContent = result;
    }

    function effAround() {
        document.getElementById('result').textContent = "eff Around!";
    }

    function processInputFunction() {
        const input = document.getElementById('userInput').value;
        try {
            const result = processInput(input); // Make sure to access exported functions correctly.
            document.getElementById('result').textContent = result;
        } catch(err) {
            console.error('Error calling our input process function', err);
        }
    }

    return {
        init,
        callGoFunctionz,
        effAround,
        processInputFunction
    };
})();

window.MyApp = MyApp;

document.addEventListener('DOMContentLoaded', (event) => {
    MyApp.init();
    document.getElementById('callGoButton').addEventListener('click', MyApp.callGoFunctionz);
    document.getElementById('effAroundButton').addEventListener('click', MyApp.effAround);
    document.getElementById('processInputButton').addEventListener('click', MyApp.processInputFunction);
});
