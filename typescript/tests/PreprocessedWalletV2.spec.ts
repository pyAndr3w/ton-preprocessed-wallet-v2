import {
    Blockchain,
    SandboxContract,
    TreasuryContract,
} from '@ton/sandbox';
import { Cell, beginCell, toNano } from '@ton/ton';
import { Wallet, walletCode } from '../wrappers/PreprocessedWalletV2';
import '@ton/test-utils';
import { KeyPair, getSecureRandomBytes, keyPairFromSeed } from '@ton/crypto';
import { randomAddress } from '@ton/test-utils';

describe('Flooder', () => {
    let blockchain: Blockchain;
    let wallet: SandboxContract<Wallet>;
    let keypair: KeyPair;
    let deployer: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        keypair = keyPairFromSeed(await getSecureRandomBytes(32));

        wallet = blockchain.openContract(
            Wallet.createFromPublicKey(keypair.publicKey)
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

    it('should deploy', async () => { });

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
        const seqno = Number(await wallet.getSeqno());

        let result = await wallet.sendTransfers(keypair, [{ to: addr, value: toNano('0.01') }], seqno);
        expect(result.transactions).toHaveTransaction({
            from: wallet.address,
            to: addr,
            value: toNano('0.01'),
        });

        // Send second message with body
        result = await wallet.sendTransfers(keypair, [{
            to: addr,
            value: toNano('0.015'),
            body: beginCell()
                .storeUint(0, 32)
                .storeStringTail('Hello, world!')
                .endCell()
        }], seqno + 1);
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
        const seqno = Number(await wallet.getSeqno());
        const transfers = [];

        for (let i = 0; i < 10; i++) {
            transfers.push({
                to: randomAddress(),
                value: toNano('0.001')
            });
        }

        let result = await wallet.sendTransfers(keypair, transfers, seqno);
        for (const transfer of transfers) {
            expect(result.transactions).toHaveTransaction({
                from: wallet.address,
                to: transfer.to,
                value: transfer.value,
            });
        }
    });

    it('should update code', async () => {
        let seqno = Number(await wallet.getSeqno());

        let result = await wallet.sendSetCode(keypair, walletCode, seqno);
        expect(result.transactions).toHaveTransaction({
            to: wallet.address,
            success: true,
        });

        seqno = Number(await wallet.getSeqno());
        result = await wallet.sendSetCode(keypair, Cell.EMPTY, seqno);
        expect(result.transactions).toHaveTransaction({
            to: wallet.address,
            success: true,
        });
    });

    it('should send batch of actions', async () => {
        const addr1 = randomAddress();
        const addr2 = randomAddress();
        const seqno = Number(await wallet.getSeqno());

        // Create a batch with both sendMsg actions
        const transfers = [
            { to: addr1, value: toNano('0.01') },
            {
                to: addr2,
                value: toNano('0.02'),
                body: beginCell().storeUint(0, 32).storeStringTail('Hello from batch!').endCell()
            }
        ];

        const result = await wallet.sendTransfers(keypair, transfers, seqno);

        expect(result.transactions).toHaveTransaction({
            from: wallet.address,
            to: addr1,
            value: toNano('0.01'),
        });

        expect(result.transactions).toHaveTransaction({
            from: wallet.address,
            to: addr2,
            value: toNano('0.02'),
            body: beginCell().storeUint(0, 32).storeStringTail('Hello from batch!').endCell(),
        });
    });

    it('should support bounce and init fields', async () => {
        const addr = randomAddress();
        const seqno = Number(await wallet.getSeqno());

        // Test with explicit bounce = false
        let result = await wallet.sendTransfers(keypair, [{
            to: addr,
            value: toNano('0.01'),
            bounce: false
        }], seqno);
        expect(result.transactions).toHaveTransaction({
            from: wallet.address,
            to: addr,
            value: toNano('0.01'),
        });

        // Test with init (StateInit)
        const init = {
            code: Cell.EMPTY,
            data: Cell.EMPTY
        };

        result = await wallet.sendTransfers(keypair, [{
            to: addr,
            value: toNano('0.02'),
            init: init
        }], seqno + 1);
        expect(result.transactions).toHaveTransaction({
            from: wallet.address,
            to: addr,
            value: toNano('0.02'),
        });
    });

    it('should handle seqno overflow with mod 2^16', async () => {
        const addr = randomAddress();
        const currentSeqno = Number(await wallet.getSeqno());

        // Test with seqno that would overflow 16 bits
        // 65537 mod 2^16 = 1, so we need to use currentSeqno + 65536 to get the same effect
        const largeSeqno = currentSeqno + 65536;

        const result = await wallet.sendTransfers(keypair, [{
            to: addr,
            value: toNano('0.01')
        }], largeSeqno);

        expect(result.transactions).toHaveTransaction({
            from: wallet.address,
            to: addr,
            value: toNano('0.01'),
        });
    });

});
