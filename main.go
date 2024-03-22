package main

import (
	"bytes"
	"encoding/json"
	"image"
	_ "image/jpeg"
	_ "image/png"

	"syscall/js"

	"fmt"
)

type GeoLocation struct {
	Latitude  float64
	Longitude float64
	Error     error
}

type Mangrove struct {
    Latitude float64 `json:"latitude"`
    Longitude float64 `json:"longitude"`
    Location GeoLocation
    UUID string `json:"uuid"`
}

type ApplicationState struct {
    UUID string `json:"uuid"`
    nextScreen string
    currentScreen string
    previousScreen string
}

var DefaultOptions = Mangrove{
    UUID: "N/A",
}

func (x Mangrove) screenData() string {
    screen, err := executeTemplateAsString("mangrove", x)
    if err != nil {
        return fmt.Sprintf("<p>ERROR: %v</p>", err.Error())
    }
    return screen
}

func homeScreenString() string {
    screen, err := executeTemplateAsString("main", nil)
    if err != nil {
        return fmt.Sprintf("ERROR: %v", err.Error())
    }
    return screen
}

func mangroveScreenString() string {
    pElement := js.Global().Get("document").Call("getElementById", "uuid")

	// Get the innerText of the <p> element
	uuid := pElement.Get("innerText").String()
    mangrove := Mangrove{
        UUID: uuid,
    }
    return mangrove.screenData()
}


func clearScreen() {
	document := js.Global().Get("document")
	screenContainer := document.Call("getElementById", "screen_container")
	screenContents := document.Call("getElementById", "screen_contents")

	if screenContents.Truthy() {
		screenContainer.Call("removeChild", screenContents)
	}
}

func updateScreen(screenString string) {
    document := js.Global().Get("document")
    screenContainer := document.Call("getElementById", "screen_container")

    clearScreen()

    newScreenContents := document.Call("createElement", "div")
	newScreenContents.Set("id", "screen_contents")
	newScreenContents.Set("innerHTML", screenString)

	screenContainer.Call("appendChild", newScreenContents)

}

func renderScreen(screen string) {
    var screenString string
    switch s := screen; s {

    case "home":
        screenString = homeScreenString()
    case "mangrove":
        screenString = mangroveScreenString()
    default:
        screenString = homeScreenString()
    }
    updateScreen(screenString)
}

func loadMangrove(this js.Value, inputs []js.Value) interface{} {
    uuid := inputs[0].String()

    mangrove := Mangrove{
        UUID: uuid,
    }

    updateScreen(mangrove.screenData())
    return nil
}

func processMangrove(this js.Value, inputs []js.Value) interface{} {
    imageArr := inputs[0]
    options := inputs[1].String()
    inBuf := make([]uint8, imageArr.Get("byteLength").Int())
    js.CopyBytesToGo(inBuf, imageArr)
    fmt.Println(options)

    mangrove := Mangrove{}
    err := json.Unmarshal([]byte(options), &mangrove)
    if err != nil {
        mangrove = DefaultOptions
        fmt.Println(err.Error())
    }

    clearScreen()
    updateScreen(mangrove.screenData())
    return nil
}

//export loadScreen
func loadScreen(this js.Value, inputs []js.Value) interface{} {
    screenName := inputs[0].String()
    renderScreen(screenName)
    return nil
}

func OpenImageFile(imgByte []byte) (image.Image, error) {
	img, _, err := image.Decode(bytes.NewReader(imgByte))
	if err != nil {
		return nil, err
	}

	return img, nil
}

func main() {

    fmt.Println("run!")
    js.Global().Set("processMangrove", js.FuncOf(processMangrove))
    js.Global().Set("loadMangrove", js.FuncOf(loadMangrove))
    js.Global().Set("loadScreen", js.FuncOf(loadScreen))

    initTemplates()
	<-make(chan bool)
}
