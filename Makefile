.PHONY: test coverage docs

all: docs coverage

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
	# quickfix for this strange problem...
	sed -i'bak' 's/&gt;/>/g' coverage.html
	sed -i'bak' 's/&lt;/</g' coverage.html
	sed -i'bak' 's/&quot;/"/g' coverage.html
	rm coverage.htmlbak
	mkdir -p docs
	mv coverage.html docs/

docs:
	docco index.js
