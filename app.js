// app.js

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Update UI to show the install button
  document.getElementById('installButton').style.display = 'block';
});

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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then(registration => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, err => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}


document.getElementById('installButton').addEventListener('click', (e) => {
  // Hide the install button
  e.target.style.display = 'none';
  // Show the install prompt
  deferredPrompt.prompt();
  // Wait for the user to respond to the prompt
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    deferredPrompt = null;
  });
});
