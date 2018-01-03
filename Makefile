all: jscc copy_jscc

jscc: rollup.config.js src/**
	@rollup -c

copy_jscc: jscc
	@cp lib/jscc.js web-demo/src/jscc.js