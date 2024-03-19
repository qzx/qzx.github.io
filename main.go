package main

import (
	"bytes"
	"encoding/json"
	"image"
	_ "image/jpeg"
	_ "image/png"

	//	"io"
	"syscall/js"

	"github.com/robert-nix/ansihtml"
	"github.com/subeshb1/wasm-go-image-to-ascii/convert"
	"fmt"
	// "github.com/xor-gate/goexif2/exif"
	// "github.com/xor-gate/goexif2/mknote"
)

type MangroveOptions struct {
    Latitude float32 `json:"latitude"`
    Longitude float32 `json:"longitude"`
    UUID string `json:"uuid"`
}

var DefaultOptions = MangroveOptions{
    Latitude: 0, 
    Longitude: 0, 
    UUID: "N/A",
}

func processMangrove(this js.Value, inputs []js.Value) interface{} {
    imageArr := inputs[0]
    options := inputs[1].String()
    inBuf := make([]uint8, imageArr.Get("byteLength").Int())
    js.CopyBytesToGo(inBuf, imageArr)

    mangroveOptions := MangroveOptions{}
    err := json.Unmarshal([]byte(options), &mangroveOptions)
    if err != nil {
        mangroveOptions = DefaultOptions
    }

    lenOrSmthn := len(inBuf)

    return fmt.Sprintf("%v : uuid: %v", lenOrSmthn, mangroveOptions.UUID)
}

func convertImage(this js.Value, inputs []js.Value) interface{} {
	imageArr := inputs[0]
	options := inputs[1].String()
	inBuf := make([]uint8, imageArr.Get("byteLength").Int())
	js.CopyBytesToGo(inBuf, imageArr)
	convertOptions := convert.Options{}
	err := json.Unmarshal([]byte(options), &convertOptions)
	if err != nil {
		convertOptions = convert.DefaultOptions
	}
	converter := convert.NewImageConverter()

	asciiImage := converter.ImageFile2ASCIIString(inBuf, &convertOptions)
	asciiHTML := ansihtml.ConvertToHTML([]byte(asciiImage))

    return string(asciiHTML)
}

func OpenImageFile(imgByte []byte) (image.Image, error) {
	img, _, err := image.Decode(bytes.NewReader(imgByte))
	if err != nil {
		return nil, err
	}

	return img, nil
}

func main() {
	js.Global().Set("processInput", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		if len(args) == 0 {
			return "No input provided"
		}
		input := args[0].String() // Convert the first argument to a string
		// Process the input or just return it with a message
		return "We have haxzors: " + input
	}))

	js.Global().Set("convertImage", js.FuncOf(convertImage))
    js.Global().Set("processMangrove", js.FuncOf(processMangrove))

	<-make(chan bool)
}
