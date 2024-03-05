package main

import (
	"syscall/js"
    "encoding/json"
    _ "image/jpeg"
    _ "image/png"
    "github.com/subeshb1/wasm-go-image-to-ascii/convert"
    "github.com/robert-nix/ansihtml"
    "fmt"
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
  fmt.Println(asciiImage)

  asciiHTML := ansihtml.ConvertToHTML([]byte(asciiImage))
  fmt.Println(string(asciiHTML))

  return string(asciiHTML)
}

// Exported function to allocate memory
func allocateMemory(length int) []byte {
    return make([]byte, length)
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
