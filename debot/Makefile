#!make

.PHONY: clean

PFX=main
OUT=build
FUNC=func
FIFT=fift

all: $(OUT)/$(PFX).code.boc print

$(OUT)/$(PFX).code.fif: $(PFX).fc
	$(FUNC) -SPA -o $(OUT)/$(PFX).code.fif -W $(OUT)/$(PFX).code.boc $(PFX).fc

$(OUT)/$(PFX).code.boc: $(OUT)/$(PFX).code.fif
	$(FIFT) $(OUT)/$(PFX).code.fif

print: $(OUT)/$(PFX).code.boc
	@echo '"$(OUT)/$(PFX).code.boc" file>B ."code boc:" cr Bx. cr cr' | fift | grep -v 'ok'
	@echo '"$(OUT)/$(PFX).code.boc" file>B B>boc ."code hash:" cr hashu X. cr' | fift | grep -v 'ok'

clean:
	rm -rf $(OUT)/$(PFX)*
