import {
    Blockchain,
    SandboxContract,
    TreasuryContract,
} from '@ton-community/sandbox';
import { Cell, beginCell, toNano } from 'ton-core';
import { Wallet } from '../wrapper/wallet';
import '@ton-community/test-utils';
import { KeyPair, getSecureRandomBytes, keyPairFromSeed } from 'ton-crypto';
import { randomAddress } from '@ton-community/test-utils';

describe('Flooder', () => {
    let code: Cell;

    beforeAll(async () => {
        code = Cell.fromBoc(
            Buffer.from(
                'B5EE9C7241010101003D000076FF00DDD40120F90001D0D33FD30FD74CED44D0D3FFD70B0F20A4830FA90822C8CBFFCB0FC9ED5444301046BAF2A1F823BEF2A2F910F2A3F800ED552E766412',
                'hex'
            )
        )[0];
    });

    let blockchain: Blockchain;
    let wallet: SandboxContract<Wallet>;
    let keypair: KeyPair;
    let deployer: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        keypair = keyPairFromSeed(await getSecureRandomBytes(32));

        wallet = blockchain.openContract(
            Wallet.createFromPublicKey(keypair.publicKey, code)
        );

        deployer = await blockchain.treasury('deployer');

        const deployResult = await wallet.sendDeploy(
            deployer.getSender(),
            toNano('0.05')
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: wallet.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {});

    it('should accept internal messages', async () => {
        const result = await deployer.send({
            to: wallet.address,
            value: toNano('1'),
        });
        expect(result.transactions).toHaveTransaction({
            from: deployer.address,
            to: wallet.address,
            success: true,
        });
    });

    it('should retrieve correct pubkey and seqno', async () => {
        expect(await wallet.getPublicKey()).toEqual(keypair.publicKey);
        expect(await wallet.getSeqno()).toEqual(0n);
    });

    it('should send simple transfers', async () => {
        const addr = randomAddress();
        let result = await wallet.sendTransfers(keypair, [
            { recipient: addr, value: toNano('0.01') },
        ]);
        expect(result.transactions).toHaveTransaction({
            from: wallet.address,
            to: addr,
            value: toNano('0.01'),
        });

        result = await wallet.sendTransfers(keypair, [
            {
                recipient: addr,
                value: toNano('0.015'),
                body: beginCell()
                    .storeUint(0, 32)
                    .storeStringTail('Hello, world!')
                    .endCell(),
            },
        ]);
        expect(result.transactions).toHaveTransaction({
            from: wallet.address,
            to: addr,
            value: toNano('0.015'),
            body: beginCell()
                .storeUint(0, 32)
                .storeStringTail('Hello, world!')
                .endCell(),
        });
    });

    it('should send several messages', async () => {
        let messages = [];
        for (let i = 0; i < 10; i++) {
            messages.push({
                recipient: randomAddress(),
                value: toNano('0.001'),
            });
        }
        let result = await wallet.sendTransfers(keypair, messages);
        for (const msg of messages) {
            expect(result.transactions).toHaveTransaction({
                from: wallet.address,
                to: msg.recipient,
                value: msg.value,
            });
        }
    });

    it('should update code', async () => {
        let result = await wallet.sendSetCode(keypair, code);
        expect(result.transactions).toHaveTransaction({
            to: wallet.address,
            success: true,
        });

        result = await wallet.sendSetCode(keypair, Cell.EMPTY);
        expect(result.transactions).toHaveTransaction({
            to: wallet.address,
            success: true,
        });
    });
});
