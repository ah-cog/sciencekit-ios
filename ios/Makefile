JADE = $(shell find . -wholename './www/*.jade')
HTML = $(JADE:.jade=.html)

all: $(HTML)

%.html: %.jade
	jade < $< --path $< > $@

watch:
	jade --watch ./www/*.jade

clean:
	rm -f $(HTML)

.PHONY: clean
