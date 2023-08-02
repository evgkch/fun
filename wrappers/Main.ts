import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, external, Sender, SendMode } from 'ton-core';
import { OpCodes } from '../helpers/OpCodes';

export type MainConfig = {
    seqno: number,
    publicKey: Buffer,
    ownerAddr: Address
};

export function mainConfigToCell(config: MainConfig): Cell {
    return beginCell()
        .storeUint(config.seqno, 32)
        .storeBuffer(config.publicKey)
        .storeAddress(config.ownerAddr)
    .endCell();
}

export class Main implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Main(address);
    }

    static createFromConfig(config: MainConfig, code: Cell, workchain = 0) {
        const data = mainConfigToCell(config);
        const init = { code, data };
        return new Main(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendWithdraw(provider: ContractProvider, via: Sender, value: bigint, amount: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(OpCodes.WITHDRAW_FUNDS, 32)
                .storeCoins(amount)
                .endCell(),
        });
    }

    async sendDeposit(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(OpCodes.DEPOSIT, 32)
                .endCell()
        });
    }

    async getBalance(provider: ContractProvider) {
        return (await provider.get('get_smc_balance', [])).stack.readNumber();
    }

    async sendChangeOwner(provider: ContractProvider, via: Sender, value: bigint, newOwner: Address) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(OpCodes.CHANGE_OWNER, 32)
                .storeAddress(newOwner)
                .endCell(),
        });
    }

    async sendExtMessage(provider: ContractProvider, seqno: number, signFunc: (buf: Buffer) => Buffer) {
        const msgToSign = beginCell()
            .storeUint(seqno, 32)
            .storeUint(OpCodes.SELF_DESTRUCT, 32)
            .endCell();
        const sig = signFunc(msgToSign.hash());
        return await provider.external(
            beginCell()
                .storeBuffer(sig)
                .storeSlice(msgToSign.asSlice())
                .endCell()
        );
    }
}
