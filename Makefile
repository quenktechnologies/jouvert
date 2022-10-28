./: lib test
	touch $@

lib: $(shell find src -type f)
	@rm -R $@ || true
	cp -R src $@
	./node_modules/.bin/tsc -p $@

test: lib test/public
	touch $@

test/public: test/public/test.js
	touch $@

test/public/test.js: test/build/run.js
	./node_modules/.bin/browserify test/build/run.js > $@

test/build/run.js: $(shell find test/unit -type f) lib
	@rm -R test/build || true
	@cp -R test/unit test/build
	./node_modules/.bin/tsc -p test/build
	cd test/build && \
	find . -name \*_test.js | \
	sed 's/[^ ]*/require("&");/g' >> run.js

.PHONY: clean
clean:
	@rm -R ./lib || true
