#!make

.PHONY: print

FIFT=fift

print:
	@echo '"code.fif" include 2 boc+>B ."code boc:" cr Bx. cr cr' | fift | grep -v 'ok'
	@echo '"code.fif" include 2 boc+>B B>boc ."code hash:" cr hashu X. cr' | fift | grep -v 'ok'

test: 
	fift pw-test.fif