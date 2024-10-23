## ton-preprocessed-wallet-v2

**code boc**

```text
0:fbd98a78ef2f37dfc4e94209d4ac9cb9dd71ffaac66cc9ba6c700d351c900dfe
```

**code hash**

```text
4cc652f17ebcfa1530b2b9a529fbca17b405f628e472519cd7d59103ca6ac59c
```

**TL-B schemes**

```c#
1729474138

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
