// app.js

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Update UI to show the install button
  document.getElementById('installButton').style.display = 'block';
});


document.querySelector('#imageInput').addEventListener(
        'change',
        function() {
          const reader = new FileReader()
          reader.onload = function() {
            // Converting the image to Unit8Array
            const arrayBuffer = this.result,
              array = new Uint8Array(arrayBuffer)
            // Call wasm exported function
            const txt = convertImage(
              array,
              JSON.stringify({
                fixedWidth: 100,
                colored: true,
                fixedHeight: 40,
              })
            )
            // Showing the ascii image in the browser
            const cdiv = document.getElementById('console')
            cdiv.innerHTML = txt
          }
          reader.readAsArrayBuffer(this.files[0])
        },
        false
      );

const MyApp = (() => {
    const go = new Go();

    async function init() {
        const resp = await fetch('main.wasm');
        const buffer = await resp.arrayBuffer();
        const {instance} = await WebAssembly.instantiate(buffer, go.importObject);
        go.run(instance);

        window.wasmInstance = instance;
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

    function allocateMemoryForWasm(byteLength) {
        // Assuming wasmModule is your instantiated Wasm module
        const ptr = allocateMemory(byteLength);
        console.log(ptr)
        return ptr;
    }

    function copyArrayBufferToWasmMemory(arrayBuffer, ptr) {
        if (!window.wasmInstance) {
            console.error('WASM instance is not initialized.');
            return;
        }
        // Get a view of the Wasm memory as a Uint8Array
        const uint8Memory = new Uint8Array(window.wasmInstance.exports.mem.buffer);
        // Create a Uint8Array from the ArrayBuffer to copy
        const uint8Array = new Uint8Array(arrayBuffer);
        // Copy the data into the Wasm memory
        uint8Memory.set(uint8Array, ptr);
    }

    function processImageFromCamera() {
        document.getElementById('imageInput').addEventListener('change', async function(event) {
            const file = event.target.files[0];
            if (!file.type.match('image.*')) {
                alert('Please select an image file.');
                return;
            }

            const arrayBuffer = await file.arrayBuffer();
            // Assume allocateMemoryForWasm and copyArrayBufferToWasmMemory are functions you've defined
            // to handle memory management between JS and your Go WASM module. You'll need to implement these
            // based on your application's memory management strategy for WASM.
            const ptr = allocateMemoryForWasm(arrayBuffer.byteLength);
            copyArrayBufferToWasmMemory(arrayBuffer, ptr);

            // Now call the Go WASM function with the pointer and length as arguments
            // Ensure processImage is correctly exposed from your Go code and callable here.
            const result = processImage(file);
            document.getElementById('imageInfo').textContent = result;

            // Remember to free any allocated memory in your WASM module to avoid leaks
        });
    }

    return {
        init,
        processInputFunction,
        allocateMemoryForWasm,
        copyArrayBufferToWasmMemory,
        processImageFromCamera
    };
})();

window.MyApp = MyApp;

document.addEventListener('DOMContentLoaded', (event) => {
    MyApp.init();
    MyApp.processImageFromCamera();
    document.getElementById('processInputButton').addEventListener('click', MyApp.processInputFunction);
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


