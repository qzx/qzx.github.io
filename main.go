package main

import (
	"syscall/js"
)

func main() {
	js.Global().Set("callGoFunction", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		return js.ValueOf("lEtsFuckinGoooo")
	}))

    js.Global().Set("processInput", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
        if len(args) == 0 {
            return "No input provided"
        }
        input := args[0].String() // Convert the first argument to a string
        // Process the input or just return it with a message
        return "We have haxzors: " + input
    }))

	<-make(chan bool)
}
