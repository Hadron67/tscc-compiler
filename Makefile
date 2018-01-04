all: jscc copy-jscc

jscc: rollup.config.js src/**
	@rollup -c

copy-jscc: jscc
	@cp lib/jscc.js web-demo/src/jscc.js
	@echo "copied jscc.js";

sandwitch:
	@[ "`whoami`" = 'root' ] && ( echo 'Okay.' ) || ( echo 'What? Make it yourself.' );