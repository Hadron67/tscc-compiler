all: jscc copy-jscc

jscc: rollup.config.js src/** templates
	@rollup -c

jscc-min: jscc
	@uglifyjs lib/jscc.js -cm --preamble > lib/jscc.min.js
	@echo "created jscc.min.js"

copy-jscc: jscc
	@cp lib/jscc.js web-demo/src/jscc.js
	@echo "copied jscc.js";

templates: $(wildcard src/templates/*.ets)
	@node scripts/etsc.js
	@echo "templates created"

install: jscc
	@npm install -g

.PHONY: sandwitch

sandwitch:
	@[ "`whoami`" = 'root' ] && ( echo 'Okay.' ) || ( echo 'What? Make it yourself.' );