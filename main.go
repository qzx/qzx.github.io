package main

import (
	"bytes"
	"encoding/json"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"syscall/js"

	"github.com/robert-nix/ansihtml"
	"github.com/subeshb1/wasm-go-image-to-ascii/convert"

	"fmt"

	"github.com/xor-gate/goexif2/exif"
	"github.com/xor-gate/goexif2/mknote"
)

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

	exif.RegisterParsers(mknote.All...)

	imageFile, err := OpenImageFile(inBuf)
	if err != nil {
		fmt.Println(err)
	}

	x, err := exif.Decode(io.ReadSeeker(inBuf))
	if err != nil {
		fmt.Println(err)
	}

	lat, long, _ := x.LatLong()
	fmt.Println("lat, long: ", lat, ", ", long)

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

	<-make(chan bool)
}
