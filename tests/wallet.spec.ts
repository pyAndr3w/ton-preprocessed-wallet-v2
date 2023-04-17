import {
    Blockchain,
    SandboxContract,
    Treasury,
    TreasuryContract,
} from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import { Wallet } from '../wrapper/wallet';
import '@ton-community/test-utils';
import { KeyPair, getSecureRandomBytes, keyPairFromSeed } from 'ton-crypto';

describe('Flooder', () => {
    let code: Cell;

    beforeAll(async () => {
        code = Cell.fromBoc(
            Buffer.from(
                'B5EE9C7241010101003F00007AFF00DDD40120F90001D0D33FD30FD74CED44D0D3FFD70B0F20A4830FA90822C8CBFFCB0FC9ED5444301046BAF2A1F823BEF2A2F910F2A3F800F80FED557CCE77EE',
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
    });

    it('should deploy', async () => {
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
});
