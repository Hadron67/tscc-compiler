all: jscc copy-jscc

jscc: rollup.config.js src/** templates
	@rollup -c

copy-jscc: jscc
	@cp lib/jscc.js web-demo/src/jscc.js
	@echo "copied jscc.js";

templates: $(wildcard src/templates/*.ets)
	@node scripts/etsc.js

.PHONY: sandwitch

sandwitch:
	@[ "`whoami`" = 'root' ] && ( echo 'Okay.' ) || ( echo 'What? Make it yourself.' );