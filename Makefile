#!make

.PHONY: print

FIFT=fift

print:
	@echo '"pw-code.fif" include 2 boc+>B ."code boc:" cr Bx. cr cr' | fift | grep -v 'ok'
	@echo '"pw-code.fif" include 2 boc+>B B>boc ."code hash:" cr hashu X. cr' | fift | grep -v 'ok'

test: 
	fift pw-test.fif
