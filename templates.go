package main

import (
	"bytes"
	"fmt"
	"html/template"
)

var tmpl *template.Template

const mainPageTemplate = `
<button id="installButton" style="display: none;">Install PWA</button>
<pre id="console" style="background: black; color: white; overflow: scroll;"></pre>
<p id="captureMangrove" onClick="MyApp.openMangrove()" class="styleButton">Capture Mangrove</p>
<p id="captureDev" onClick="MyApp.emulateMangrove()" class="styleButton">Dev capture</p>
<p id="status"></p>

<canvas id="canvas" hidden style="width: 100%"></canvas>
`

const mangrovePageTemplate = `
<div class="container">
    <div class="split left">
        <input type="file" name="imageInput" id="imageInput" capture="camera" accept="image/*" onChange="MyApp.imageProcessor(event)" hidden>
        <button id="QRButton" class="styleButton" onClick="document.getElementById('imageInput').click()"> Capture Mangrove </botton>
    </div>
    <div class="split right">
        <div id="mangrove">
            <p> Mangrove ID: <span id="uuid">{{ .UUID }}</span> <br>
 Lat: <span id="latitude">{{ .Latitude }}</span> <br>
 Long: <span id="longitude">{{ .Longitude }}</span> <br>
            </p>
        </div>
    </div>
</div>
<br>
<span id="homeButton" class="styleButton" onClick="MyApp.homeScreen()">GET ME BACK</span>
`

func initTemplates() {
	tmpl = template.New("")
	var err error
	tmpl, err = tmpl.New("main").Parse(mainPageTemplate)
	if err != nil {
		fmt.Println("Error parsing main page template:", err)
	}

	tmpl, err = tmpl.New("mangrove").Parse(mangrovePageTemplate)
	if err != nil {
		fmt.Println("Error parsing mangrove page template:", err)
	}
}

func executeTemplateAsString(templateName string, data interface{}) (string, error) {
	var buf bytes.Buffer
	err := tmpl.ExecuteTemplate(&buf, templateName, data)
	if err != nil {
		return "", err // Return the error to the caller
	}
	return buf.String(), nil // Return the buffer's contents as a string
}
