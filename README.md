## ton-preprocessed-wallet-v2r1

**code boc**

```text
B5EE9C7241010101003C000074FF00DDD40120F90001D0D33FD30FD74CED44D0D3FFD70B0F20A4A9380F22C8CBFFCB0FC9ED5444301046BAF2A1F823BEF2A2F910F2A3F800ED55D91C357F
```

**code hash**

```text
49B91C4133CAFFC163CF36B87572A73EC918C251FD7CE4F424D699F0CC5D6781
```

**TL-B schemes**

```c#
_ {n:#} valid_until:uint64 seq_no:uint16 actions:^(OutList n) { n <= 255 } = MsgInner n;

msg_body$_ {n:#} sign:bits512 ^(MsgInner n) = ExtInMsgBody n;

storage$_ pub_key:bits256 seq_no:uint16 = Storage;
```

**Error codes**

-   `33` - incorrect sequence number
-   `34` - overdue
-   `35` - invalid signature

## debot usage

We recommend using special debot TVM code to prepare messages for
this wallet smart contract, running it locally in TVM. This will help avoid bugs, as building a message for this smart contract may not seem easy. <br> Read more in [`debot/README.md`](./debot/README.md).

## TypeScript usage

You can also use this wallet contract through TypeScript (or JavaScript) via wrapper from [`typescript/wrapper/wallet.ts`](./typescript/wrapper/wallet.ts)

## Audit

- [Pruvendo at 05/11/23](./audit/Pruvendo-230511.md)

## License

[GNU LESSER GENERAL PUBLIC LICENSE Version 3](./LICENSE.LGPL)
