// app.js

let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Update UI to show the install button
  document.getElementById("installButton").style.display = "block";
});

const MyApp = (() => {
  const go = new Go();

  async function init() {
    const resp = await fetch("main.wasm");
    const buffer = await resp.arrayBuffer();
    const { instance } = await WebAssembly.instantiate(buffer, go.importObject);
    go.run(instance);

    window.wasmInstance = instance;
  }

  function getCurrentLocation() {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        function (position) {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
          document.getElementById("lat").textContent = latitude;
          document.getElementById("long").textContent = longitude;
        },
        function (error) {
          console.error("Error obtaining location: " + error.message);
        },
        {
          enableHighAccuracy: true,
        },
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  }

  async function captureLocationData() {
    try {
      const permissionStatus = await navigator.permissions.query({
        name: "geolocation",
      });

      if (permissionStatus.state === "granted") {
        getCurrentLocation();
      } else if (permissionStatus.state === "prompt") {
        getCurrentLocation();
      } else if (permissionStatus.state === "denied") {
        console.error(
          "Location permission has been denied. Unable to retrieve location.",
        );
      }

      permissionStatus.onchange = () => {
        console.log(
          `The permission state for geolocation has changed to ${permissionStatus.state}`,
        );
      };
    } catch (error) {
      console.error(`Error checking location permission: ${error}`);
    }
  }

  function captureQR() {
    var video = document.createElement("video");
    var canvasElement = document.getElementById("canvas");
    var canvas = canvasElement.getContext("2d");
    var outputData = document.getElementById("uuid");

    // Use facingMode: environment to attemt to get the front camera on phones
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then(function (stream) {
        video.srcObject = stream;
        video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
        video.play();
        requestAnimationFrame(tick);
      });

    function tick() {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvasElement.hidden = false;
        canvasElement.height = video.videoHeight;
        canvasElement.width = video.videoWidth;
        canvas.drawImage(
          video,
          0,
          0,
          canvasElement.width,
          canvasElement.height,
        );
        var imageData = canvas.getImageData(
          0,
          0,
          canvasElement.width,
          canvasElement.height,
        );
        var code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });
        if (code) {
          outputData.innerText = code.data;
          canvasElement.hidden = true;
          return;
        } else {
          outputData.innerText = "Searching for QR Code";
        }
      }
      requestAnimationFrame(tick);
    }
  }

  async function captureMangrove() {
    await captureLocationData();
    captureQR();
    document.getElementById("imageInput").hidden = false;
  }

  function processImageFromCamera() {
    const imageInput = document.getElementById("imageInput");
    imageInput.addEventListener(
      "change",
      function () {
        const reader = new FileReader();
        reader.onload = function () {
          // Converting the image to Unit8Array
          const arrayBuffer = this.result,
            array = new Uint8Array(arrayBuffer);
          // Call wasm exported function
          const lat = document.getElementById("lat").innerText;
          const long = document.getElementById("long").innerText;
          const uuid = document.getElementById("uuid").innerText;
          const txt = convertImage(
            array,
            JSON.stringify({
              latitude: lat,
              longitude: long,
              uuid: uuid,
            }),
          );
          // Showing the ascii image in the browser
          const cdiv = document.getElementById("console");
          cdiv.hidden = false;
          cdiv.innerText = txt;
        };
        reader.readAsArrayBuffer(this.files[0]);
      },
      false,
    );
  }

  return {
    init,
    captureQR,
    captureLocationData,
    processImageFromCamera,
    captureMangrove,
  };
})();

window.MyApp = MyApp;

document.addEventListener("DOMContentLoaded", (event) => {
  MyApp.init();
  MyApp.processImageFromCamera();
  document
    .getElementById("captureMangrove")
    .addEventListener("click", MyApp.captureMangrove);
  document.getElementById("installButton").addEventListener("click", (e) => {
    e.target.style.display = "none";
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt");
      } else {
        console.log("User dismissed the install prompt");
      }
      deferredPrompt = null;
    });
  });
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").then(
      (registration) => {
        console.log(
          "ServiceWorker registration successful with scope: ",
          registration.scope,
        );
      },
      (err) => {
        console.log("ServiceWorker registration failed: ", err);
      },
    );
  });
}
