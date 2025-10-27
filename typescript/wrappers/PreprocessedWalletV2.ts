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
    OutAction,
    OutActionSendMsg,
    OutActionSetCode,
    storeOutList,
} from '@ton/ton';
import { KeyPair, sign } from '@ton/crypto';

const MAX_ACTIONS = 255;
const DEFAULT_VALID_UNTIL_OFFSET = 3600;


export const walletCode = Cell.fromBoc(
    Buffer.from(
        'B5EE9C7241010101003D000076FF00DDD40120F90001D0D33FD30FD74CED44D0D3FFD70B0F20A4830FA90822C8CBFFCB0FC9ED5444301046BAF2A1F823BEF2A2F910F2A3F800ED552E766412',
        'hex'
    )
)[0];

export type TransferMessage = {
    to: Address;
    value: bigint;
    body?: Cell;
    mode?: SendMode;
    bounce?: boolean;
    init?: StateInit;
};

export function createTransferAction(msg: TransferMessage): OutActionSendMsg {
    const bounce = msg.bounce ?? true;

    return {
        type: 'sendMsg',
        mode: msg.mode || SendMode.PAY_GAS_SEPARATELY,
        outMsg: {
            info: {
                type: 'internal',
                ihrDisabled: true,
                bounce: bounce,
                bounced: false,
                dest: msg.to,
                value: { coins: msg.value },
                ihrFee: 0n,
                forwardFee: 0n,
                createdLt: 0n,
                createdAt: 0
            },
            init: msg.init,
            body: msg.body || Cell.EMPTY
        }
    };
}

export function createSetCodeAction(code: Cell): OutActionSetCode {
    return {
        type: 'setCode',
        newCode: code
    };
}


export class Wallet implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) { }

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

    async sendExternalMessage(
        provider: ContractProvider,
        keypair: KeyPair,
        actions: OutAction[],
        seqno: number,
        validUntil?: number
    ) {
        if (actions.length > MAX_ACTIONS) {
            throw new Error(`Maximum ${MAX_ACTIONS} actions allowed`);
        }

        if (actions.length === 0) {
            throw new Error('At least one action is required');
        }

        if (validUntil === undefined) {
            validUntil = Math.floor(Date.now() / 1000) + DEFAULT_VALID_UNTIL_OFFSET;
        }

        const actionsCell = beginCell();
        storeOutList(actions)(actionsCell);

        const msgInner = beginCell()
            .storeUint(validUntil, 64)
            .storeUint(seqno & 0xFFFF, 16)
            .storeRef(actionsCell.endCell())
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
        transfers: TransferMessage[],
        seqno: number,
        validUntil?: number
    ) {
        if (transfers.length === 0) {
            throw new Error('At least one transfer is required');
        }
        const actions = transfers.map(createTransferAction);
        await this.sendExternalMessage(provider, keypair, actions, seqno, validUntil);
    }

    async sendSetCode(
        provider: ContractProvider,
        keypair: KeyPair,
        code: Cell,
        seqno: number,
        validUntil?: number
    ) {
        const action = createSetCodeAction(code);
        await this.sendExternalMessage(provider, keypair, [action], seqno, validUntil);
    }

    private async getStorageParams(provider: ContractProvider): Promise<{ publicKey: Buffer; seqno: bigint } | { publicKey: undefined; seqno: bigint }> {
        const state = (await provider.getState()).state;
        if (state.type == 'active') {
            const data = Cell.fromBoc(state.data!)[0].beginParse();
            return { publicKey: data.loadBuffer(32), seqno: data.loadUintBig(16) };
        }
        return { publicKey: undefined, seqno: BigInt(0) };
    }

    async getPublicKey(provider: ContractProvider): Promise<Buffer | undefined> {
        const { publicKey } = await this.getStorageParams(provider);
        return publicKey;
    }

    async getSeqno(provider: ContractProvider): Promise<bigint> {
        const { seqno } = await this.getStorageParams(provider);
        return seqno;
    }
}
