// app.js

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Update UI to show the install button
  document.getElementById('installButton').style.display = 'block';
});

async function getLocation() {
  try {
    // Check if the Geolocation permission has been granted
    const permissionStatus = await navigator.permissions.query({ name: "geolocation" });

    // Handle the permission state
    if (permissionStatus.state === 'granted') {
      // Permission was already granted
      getCurrentLocation();
    } else if (permissionStatus.state === 'prompt') {
      // Permission needs to be prompted for, ask for it then get location
      getCurrentLocation();
    } else if (permissionStatus.state === 'denied') {
      // Permission was denied
      console.error("Location permission has been denied. Unable to retrieve location.");
    }

    // Listen for changes on permission
    permissionStatus.onchange = () => {
      console.log(`The permission state for geolocation has changed to ${permissionStatus.state}`);
    };
  } catch (error) {
    console.error(`Error checking location permission: ${error}`);
  }
}

function getCurrentLocation() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(function(position) {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
      document.getElementById('gpsOut').textContent = `${latitude}, ${longitude}`;
    }, function(error) {
      console.error("Error obtaining location: " + error.message);
    }, {
      enableHighAccuracy: true
    });
  } else {
    console.log("Geolocation is not supported by this browser.");
  }
}

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
        getLocation();
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
    document.getElementById('scanQRButton').addEventListener('click', captureQR);
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


function captureQR() {
    var video = document.createElement("video");
    var canvasElement = document.getElementById("canvas");
    var canvas = canvasElement.getContext("2d");
    var loadingMessage = document.getElementById("loadingMessage");
    var outputContainer = document.getElementById("output");
    var outputMessage = document.getElementById("outputMessage");
    var outputData = document.getElementById("outputData");

    function drawLine(begin, end, color) {
      canvas.beginPath();
      canvas.moveTo(begin.x, begin.y);
      canvas.lineTo(end.x, end.y);
      canvas.lineWidth = 4;
      canvas.strokeStyle = color;
      canvas.stroke();
    }

    // Use facingMode: environment to attemt to get the front camera on phones
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function(stream) {
      video.srcObject = stream;
      video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
      video.play();
      requestAnimationFrame(tick);
    });

    function tick() {
      loadingMessage.innerText = "⌛ Loading video..."
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        loadingMessage.hidden = true;
        canvasElement.hidden = false;
        outputContainer.hidden = false;

        canvasElement.height = video.videoHeight;
        canvasElement.width = video.videoWidth;
        canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
        var imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
        var code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });
        if (code) {
          drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#FF3B58");
          drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "#FF3B58");
          drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "#FF3B58");
          drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "#FF3B58");
          outputMessage.hidden = true;
          outputData.parentElement.hidden = false;
          outputData.innerText = code.data;
        } else {
          outputMessage.hidden = false;
          outputData.parentElement.hidden = true;
        }
      }
      requestAnimationFrame(tick);
    }
}
