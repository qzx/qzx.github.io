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

    function drawLine(begin, end, color) {
      canvas.beginPath();
      canvas.moveTo(begin.x, begin.y);
      canvas.lineTo(end.x, end.y);
      canvas.lineWidth = 4;
      canvas.strokeStyle = color;
      canvas.stroke();
    }

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
          drawLine(
            code.location.topLeftCorner,
            code.location.topRightCorner,
            "#FF3B58",
          );
          drawLine(
            code.location.topRightCorner,
            code.location.bottomRightCorner,
            "#FF3B58",
          );
          drawLine(
            code.location.bottomRightCorner,
            code.location.bottomLeftCorner,
            "#FF3B58",
          );
          drawLine(
            code.location.bottomLeftCorner,
            code.location.topLeftCorner,
            "#FF3B58",
          );
          outputData.innerText = code.data;
          canvasElement.hidden = true;
          return;
        } else {
          outputData.parentElement.hidden = true;
        }
      }
      requestAnimationFrame(tick);
    }
  }

  async function captureMangrove() {
    await captureLocationData();
    captureQR();
  }

  return {
    init,
    captureQR,
    captureLocationData,
    captureMangrove,
  };
})();

window.MyApp = MyApp;

document.addEventListener("DOMContentLoaded", (event) => {
  MyApp.init();
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
