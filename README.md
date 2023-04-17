##  ton-preprocessed-wallet-v2

**code boc**
```text
B5EE9C7241010101003F00007AFF00DDD40120F90001D0D33FD30FD74CED44D0D3FFD70B0F20A4830FA90822C8CBFFCB0FC9ED5444301046BAF2A1F823BEF2A2F910F2A3F800F80FED557CCE77EE
```

**code hash**
```text
F9201AD8111057AACD885E694F34BBB6308B104D088A54E1EFBD1A3359E2B2D5
```

**TL-B schemes**
```c#
_ {n:#} valid_until:uint64 seq_no:uint16 actions:^(OutList n) { n <= 255 } = MsgInner n;

msg_body$_ {n:#} sign:bits512 ^(MsgInner n) = ExtInMsgBody n;

storage$_ pub_key:bits256 seq_no:uint16 = Storage;
```

## debot usage

We recommend using special debot TVM code to prepare messages for
this wallet smart contract, running it locally in TVM. This will help avoid bugs, as building a message for this smart contract may not seem easy. <br> Read more in [`debot/README.md`](./debot/README.md).

## License
[GNU LESSER GENERAL PUBLIC LICENSE Version 3](./LICENSE.LGPL)
