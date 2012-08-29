test:
	mocha -R spec -u tdd test.js

coverage:
	mkdir -p lib
	mkdir -p lib-cov
	ln -s ../index.js lib/index.js
	jscoverage lib lib-cov
	TSM_COV=1 mocha -R html-cov -u tdd test.js > coverage.html
	rm -rf lib
	rm -rf lib-cov
