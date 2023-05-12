<img src="https://github.com/Pruvendo/tvm-preprocessed-wallet-audit/blob/8742443bcfbb8419ae7271ed41782154dc29c79e/new_logo.png?raw=true" width=150px/>


# TVM-preprocessed-Wallet audit report

The present audit report has been prepared by [Pruvendo at 05/11/23](https://github.com/Pruvendo/tvm-preprocessed-wallet-audit/blob/8742443bcfbb8419ae7271ed41782154dc29c79e/AUDIT.md)

# Introduction

The present audit is conducted against
[tvm-preprocessed-wallet](https://github.com/ever-incubator/tvm-preprocessed-wallet/blob/aebadc7ba6ff8fc7f99c98b22ec2197fd7e94038/code.fif) contract with the code equals to the
commit ```aebadc7ba6ff8fc7f99c98b22ec2197fd7e94038```.

The contract represents a simple TVM-based (applicable
for such blockchains as [TON](https://ton.org/) or [Everscale](https://everscale.network/)) wallet,
with the basic functionality and strongly optimized
in terms of gas spending.

# Executive summary

The audit result is **POSITIVE** and the contract is
recommended for moving into production.

# Methodology

While the present project is just an audit, without
formal verificattion of the code, the following light
technologies are being used:
- the whole workflow is manually analyzed step-by-step
- the possibility of typical attacks is analyzed
- manual check for optimized gas usage

# Workflow analysis

The following analysis is based of TVM Specification created by Nickolay Durov at 03/23/2020/
as well as [Fift documentation](https://test.ton.org/fiftbase.pdf). According to the code the
[ASM library](https://github.com/ton-blockchain/ton/blob/master/crypto/fift/lib/Asm.fif) is used.

The initial value of stack is described [here](https://docs.ton.org/learn/tvm-instructions/tvm-overview) and assumes five elements put on stack.
Only two of them are used and latter are ignored and
so skipped from the further consideration.

The valuable stack elements are:
- _selector_ - boolean:
    - _FALSE_ - for internal messages
    - _TRUE_ - for external messages
- _msg_ - slice that represents message body according
  to the  Chapter _A.11.9_ of the TVM documentation mentioned
  above as well as in section 3.1.7 of [Blockchain documentation](https://ton.org/tblkch.pdf)

The message body has the following parameters:
- data:
    - _sign_ - at least 512 bits representing signature
- ref:
    - _data_ - cell representing the rest of the message
        - data:
            - _until_ - 64-bit value representing time until the message is valid
            - _num_ - 16-bit value representing the message sequence number
        - ref:
            - _actions_ - the cell representing the code to be executed

Persistent data is a cell that contains two bit sequences with no references:
- _key_ - 256-bit sequence representing the private key of the contract owner
- _cur_ - the current value sequence number (16 bits) that is expected in the next message

| Instruction | Comments | S0 | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SETCP0 | Ensures the set of instructions corresponds to ones provided in the document mentioned above | selector | msg |||||||||
| IFNOTRET | Only external messages allowed | msg(ext) ||||||||||
| LDREF | Load signature | sign | data |||||||||
| SWAP || data | sign |||||||||
| DUP || data | data | sign ||||||||
| HASHCU | Computes hash of the _data_ | hash(data) | data | sign ||||||||
| SWAP || data | hash(data) | sign ||||||||
| CTOS || data(slice) | hash(data) | sign ||||||||
| LDU 64 | Loads time until the message is valid | data(-until) | until | hash(data) | sign |||||||
| LDU 16 | Loads message sequence number | data(-until-num) | num | until | hash(data) | sign ||||||
| PLDREF | Preloads (substitutes) the remnants of _data_ slice with the _actions_ reference | actions | num | until | hash(data) | sign ||||||
| PUSH c4 | Loads persistents | c4 | actions | num | until | hash(data) | sign |||||
| CTOS || c4(sliced) | actions | num | until | hash(data) | sign |||||
| LDU 256 | Loads _key_ value | c4(-key) | key | actions | num | until | hash(data) | sign ||||
| PLDU 16 | Preloads _cur_ value | cur | key | actions | num | until | hash(data) | sign ||||
| DUP || cur | cur | key | actions | num | until | hash(data) | sign |||
| INC | Increments current sequence number | cur+1 | cur | key | actions | num | until | hash(data) | sign |||
| PUSHPOW2 16 | Pushes 65536 | 65536 | cur+1 | cur | key | actions | num | until | hash(data) | sign ||
| MOD || (cur+1)%2<sup>16</sup> | cur | key | actions | num | until | hash(data) | sign |||
| PUSH s2 || key | (cur+1)%2<sup>16</sup> | cur | key | actions | num | until | hash(data) | sign ||
| NEWC || empty builder | key | (cur+1)%2<sup>16</sup> | cur | key | actions | num | until | hash(data) | sign |
| STU 256 | Stores _key_ | builder(key) |  (cur+1)%2<sup>16</sup> | cur | key | actions | num | until | hash(data) | sign ||
| STU 16 | Stores new _cur_ | builder(key, (cur+1)%2<sup>16</sup>) | cur | key | actions | num | until | hash(data) | sign |||
| ENDC || cell(key, (cur+1)%2<sup>16</sup>) | cur | key | actions | num | until | hash(data) | sign |||
| POP c4 | Update persistents with new _cur_ value | cur | key | actions | num | until | hash(data) | sign ||||
| XCHG3 s4 s3 s0 || cur | num | until | key | actions | hash(data) | sign ||||
| XCHG s4 s6 || cur | num | until | key | sign | hash(data) | actions ||||
| EQUAL | Checks if the message number is correct | cur==num | until | key | sign | hash(data) | actions |||||
| THROWIFNOT 33 | Throws an exception in case of incorrect message number | until | key | sign | hash(data) | actions ||||||
| NOW || now | until | key | sign | hash(data) | actions |||||
| GEQ | Checks if the message is still valid | now &ge; until | key | sign | hash(data) | actions ||||||
| THROWIFNOT 34 | Throws an exception if the is expired | key | sign | hash(data) | actions |||||||
| CHKSIGNU | Checks if the signature is correct | signature correct? | actions |||||||||
| THROWIFNOT 35 | Throws an exception if the signature is incorrect | actions ||||||||||
| ACCEPT | Accepts spending gas from the receiving contract | actions ||||||||||
| POP c5 | Stores output actions |||||||||||

# Analysis result

## Workflow analysis

The detailed workflow analysis provided above demonstrates that the contract works correctly and provides
the comprehensive checks for all the input
parameteres, including the security ones.

## Attack analysis

The most common attacks for the wallet contracts are:

- Violation of security
- Replay attack
- Exception after _ACCEPT_

### Violation of security

The contract provides the correct process of checking the signature of the sender thus
eliminating this risk.

### Replay attack

The contract provides a defence against replay protection that is based on exact
equivalence of the expected message counter (incremented at each message)
and the message number provided.

Such a defence:
- prevents a replay attack
- elimitates the risk of counter overflow by using modulo wrapped increment
  (with modulo equals to 2<sup>16</sup>)
- at the same time the modulo is big enough to avoid the risk of having two
  non-expired messages with the same number

### Exception after _ACCEPT_

Exceptions after _ACCEPT_ may lead to uncontrolled
gas spending from the contract balance due to the
repeatable calls of public methods by the attacker.

In the present contract the developer filtered out
all the potentially malicious calles before invoking
the _ACCEPT_ primitive thus eliminating the
possibility of the attack being discussed.


## Performance and gas spending analysis

The developers chose to use almost pure TVM Assembler
(Fift environment is just a boilerplate that keeps the
final code intacted) that let them to apply some
exotic and efficent primitives such as _XCHG3_ or
_PUSHPOW2_ . All the doubtful cases (such as using
_PUSHPOW2_ together with _MOD_ instead of _PUSH_  and
_AND_ ) were analyzed and the auditors came to
conclusion that developers chose the optimal approach
in all the cases were considered.

# Issues found

No issues found throughout the present audit.

# Audit outcome

As a result of the audit the auditors recommend the
contract to be deployed into production. The outcome
is **POSITIVE**.
