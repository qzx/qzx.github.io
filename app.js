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
    await checkGeolocationPermission();
  }

  function getCurrentLocation() {
    return new Promise((resolve) => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          function (position) {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
            resolve({ latitude, longitude }); // Resolve the promise with the coordinates
          },
          function (error) {
            console.error("Error obtaining location: " + error.message);
            resolve({ latitude: 0.0, longitude: 0.0 }); // Resolve with 0,0 on error
          },
          { enableHighAccuracy: true },
        );
      } else {
        console.log("Geolocation is not supported by this browser.");
        resolve({ latitude: 0.0, longitude: 0.0 }); // Resolve with 0,0 if geolocation is not supported
      }
    });
  }

  async function checkGeolocationPermission() {
    try {
      const permissionStatus = await navigator.permissions.query({
        name: "geolocation",
      });

      permissionStatus.onchange = () => {
        console.log(
          `The permission state for geolocation has changed to ${permissionStatus.state}`,
        );
      };

      if (permissionStatus.state === "denied") {
        console.error(
          "Location permission has been denied. Unable to retrieve location.",
        );
      } else {
        getCurrentLocation();
      }
    } catch (error) {
      console.error(`Error checking location permission: ${error}`);
    }
  }

  function openMangrove() {
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
            loadMangrove(code)
            return
        } else {
          outputData.innerText = "Searching for QR Code";
        }
      }
      requestAnimationFrame(tick);
    }
  }

  function emulateMangrove() {
    loadMangrove("d7b51511-442c-44d4-b66c-a98a07901b0e")
  }

  function imageProcessor(event) {
    const reader = new FileReader();
    reader.onload = function () {
      const arrayBuffer = this.result;
      const array = new Uint8Array(arrayBuffer);
      const uuid = document.getElementById("uuid").innerText;
      let latitude = 0.0;
      let longitude = 0.0;
      getCurrentLocation()
        .then(({ latitude: lat, longitude: lng }) => {
          latitude = parseFloat(lat);
          longitude = parseFloat(lng);
          console.log(`Got Latitude: ${latitude}, Longitude: ${longitude}`);
          processMangrove(
            array,
            JSON.stringify({
              uuid: uuid,
              latitude: latitude,
              longitude: longitude,
            }),
          );
        })
        .catch((error) => {
          console.error("An error occured: ", error);
        });
    };
    reader.readAsArrayBuffer(event.target.files[0]);
  }


  function homeScreen() {
    loadScreen("home");
  }

  return {
    init,
    imageProcessor,
    openMangrove,
    emulateMangrove,
    homeScreen,
  };
})();

window.MyApp = MyApp;

document.addEventListener("DOMContentLoaded", (event) => {
  MyApp.init();
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
