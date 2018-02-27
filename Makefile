all: tscc copy-tscc

tscc: rollup.config.js src/** templates
	@rollup -c

tscc-min: tscc
	@uglifyjs lib/tscc.js -cm --preamble > lib/tscc.min.js
	@echo "created tscc.min.js"

copy-tscc: tscc
	@cp lib/tscc.js web-demo/src/tscc.js
	@cp lib/tscc.d.ts web-demo/src/tscc.d.ts
	@echo "copied tscc.js";

templates: $(wildcard src/templates/*.ets)
	@node scripts/etsc.js
	@echo "templates created"

install: tscc
	@npm install -g

.PHONY: sandwitch

sandwitch:
	@[ "`whoami`" = 'root' ] && ( echo 'Okay.' ) || ( echo 'What? Make it yourself.' );