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

    function captureLocationData() {
        
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(function(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    // You can now use these coordinates to associate with the picture taken.
    console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
  }, function(error) {
    console.error("Error Code = " + error.code + " - " + error.message);
  }, {
    enableHighAccuracy: true // This asks the device to use the best method to get the location
  });
} else {
  /* geolocation IS NOT available */
              console.log("Geolocation is not supported by this browser.");
        }
        gpsdata = 'tempgps'
        document.getElementById('gpsOut').textContent = gpsdata;
    }

    function processImageFromCamera() {
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
      )
    }

    return {
        init,
        processInputFunction,
        processImageFromCamera,
        captureLocationData
    };
})();

window.MyApp = MyApp;

document.addEventListener('DOMContentLoaded', (event) => {
    MyApp.init();
    MyApp.processImageFromCamera();
    MyApp.captureLocationData();
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


