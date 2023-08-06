import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    Slice,
    StateInit,
    storeStateInit,
} from 'ton-core';
import { KeyPair, sign } from 'ton-crypto';

type MessageToSend = {
    recipient: Address;
    value: bigint;
    init?: StateInit;
    body?: Cell;
};

export const walletCode = Cell.fromBoc(
    Buffer.from(
        'B5EE9C7241010101003D000076FF00DDD40120F90001D0D33FD30FD74CED44D0D3FFD70B0F20A4830FA90822C8CBFFCB0FC9ED5444301046BAF2A1F823BEF2A2F910F2A3F800ED552E766412',
        'hex'
    )
)[0];

function formSendMsgAction(msg: MessageToSend, mode: number): Slice {
    let b = beginCell()
        .storeUint(0x18, 6)
        .storeAddress(msg.recipient)
        .storeCoins(msg.value)
        .storeUint(0, 105);
    if (msg.init) {
        b.storeUint(3, 2);
        b.storeRef(beginCell().store(storeStateInit(msg.init)).endCell());
    } else {
        b.storeUint(0, 1);
    }
    if (msg.body) {
        b.storeUint(1, 1);
        b.storeRef(msg.body);
    } else {
        b.storeUint(0, 1);
    }
    return beginCell()
        .storeUint(0x0ec3c86d, 32)
        .storeUint(mode, 8)
        .storeRef(b.endCell())
        .endCell()
        .asSlice();
}

function formSetCodeAction(code: Cell): Slice {
    return beginCell()
        .storeUint(0xad4de08e, 32)
        .storeRef(code)
        .endCell()
        .asSlice();
}

export class Wallet implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) {}

    static createFromAddress(address: Address) {
        return new Wallet(address);
    }

    static createFromPublicKey(publicKey: Buffer, workchain = 0) {
        const data = beginCell()
            .storeBuffer(publicKey, 32)
            .storeUint(0, 16)
            .endCell();
        const init = { code: walletCode, data };
        return new Wallet(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: Cell.EMPTY,
        });
    }

    private async sendActions(
        provider: ContractProvider,
        actions: Slice[],
        keypair: KeyPair
    ) {
        let actionsCell = Cell.EMPTY;
        for (const action of actions) {
            actionsCell = beginCell()
                .storeRef(actionsCell)
                .storeSlice(action)
                .endCell();
        }

        const msgInner = beginCell()
            .storeUint(Math.floor(Date.now() / 1000) + 3600, 64)
            .storeUint((await this.getSeqno(provider))!, 16)
            .storeRef(actionsCell)
            .endCell();
        const hash = msgInner.hash();
        const signature = sign(hash, keypair.secretKey);
        await provider.external(
            beginCell().storeBuffer(signature, 64).storeRef(msgInner).endCell()
        );
    }

    async sendTransfers(
        provider: ContractProvider,
        keypair: KeyPair,
        messages: MessageToSend[]
    ) {
        await this.sendActions(
            provider,
            messages.map((msg) => formSendMsgAction(msg, 3)),
            keypair
        );
    }

    async sendSetCode(
        provider: ContractProvider,
        keypair: KeyPair,
        code: Cell
    ) {
        await this.sendActions(provider, [formSetCodeAction(code)], keypair);
    }

    async getPublicKey(
        provider: ContractProvider
    ): Promise<Buffer | undefined> {
        const state = (await provider.getState()).state;
        if (state.type == 'active') {
            const data = Cell.fromBoc(state.data!)[0].beginParse();
            return data.loadBuffer(32);
        }
    }

    async getSeqno(provider: ContractProvider): Promise<bigint | undefined> {
        const state = (await provider.getState()).state;
        if (state.type == 'active') {
            const data = Cell.fromBoc(state.data!)[0].beginParse();
            data.skip(256);
            return data.loadUintBig(16);
        }
    }
}
