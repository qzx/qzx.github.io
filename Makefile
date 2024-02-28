# Define variables
GO=go
GOBUILD=$(GO) build
GOCLEAN=$(GO) clean
GOGET=$(GO) get
GORUN=$(GO) run
BINARY_NAME=main.wasm
BINARY_UNIX=$(BINARY_NAME)_unix
SERVER=python3 -m http.server
PORT=9090

# Compile the Go WebAssembly module
compile:
	GOOS=js GOARCH=wasm $(GOBUILD) -o $(BINARY_NAME) main.go
	cp "$(shell go env GOROOT)/misc/wasm/wasm_exec.js" .

# Install dependencies (if any)
install:
	$(GOGET) -u

# Run a local development server
run:
	$(SERVER) $(PORT)

# Clean build files
clean:
	$(GOCLEAN)
	rm -f $(BINARY_NAME)
	rm -f wasm_exec.js

# A help command to list available commands
help:
	@echo "Available commands:"
	@echo "  compile      Compile the Go WebAssembly module"
	@echo "  install      Install Go dependencies"
	@echo "  run          Run a local development server on port $(PORT)"
	@echo "  clean        Clean build files"

