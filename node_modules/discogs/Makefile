PATH := ./node_modules/.bin:${PATH}

init:
	npm install --dev

docs:
	docco src/*.coffee

clean-docs:
	rm -rf docs/

clean: clean-docs

dist: clean init docs
	coffee -o lib/ -c src/
