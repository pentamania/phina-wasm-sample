WASM_SRC := target/wasm32-unknown-unknown/release/phina_wasm_sample.wasm
WASM_DEST := app/wasm/main.wasm

build:
	mkdir -p app/wasm
	cargo fmt #formatter
	cargo build --target wasm32-unknown-unknown --release
	cp ${WASM_SRC} ${WASM_DEST}