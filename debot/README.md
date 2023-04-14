## util smc for ton-preprocessed-wallet-v2

* `make all` – compile contract
* `make print` – print code boc and code hash
* `make clean` – clean build directory

## get methods

* `(int, int) pwv2::parse_storage(cell c)`
* `(cell) pwv2::pack_storage(int pub_key, int seq_no)`
* `(cell) pwv2::pack_send(tuple msgs)`
* `(cell) pwv2::pack_for_sign(int valid_until, int seq_no, cell actions)`
* `(cell) pwv2::pack_msg_body(slice sign, cell data)`

*tuple msgs is a tuple of tuples: <br>
`[[slice to, int value, int mode, int bounce, cell body, cell init]]`

## compiled code

**code boc:**
```text
B5EE9C7241010D0100DD000114FF00F4A413F4BCF2C80B0102016202030002D0020120040502016A06070201200B0C01FBB325B232485BE21C24D4C06E639B94CC1BE05BC98411440D40A4A00624A004389010DC00F232C15633C5807E80B2DA085BA51C0CB280255CC072C07338885BA51C0CB280238780483408B3CC4875D26821026F258C1FD6328033261C0C80B2800073C5B8B8B2608403B0F21B7232C7C4B2C1F300F23304F3C4F240A93A2008020166090A000810235F030013A6D60591967F961F9993000FA6CF90B19E2D99930011B88ECD0D3FFD70B0F80013BB7B801C8CBFFCB0FC98A6D12744
```

**code hash:**
```text
320C6407CB879EE313C9B134E398591E826261E64D24CC4E8F8FE4C876340873
```
