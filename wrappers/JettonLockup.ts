import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode, toNano } from 'ton-core';

export type JettonLockupConfig = {
    owner: Address;
    receiver: Address;
    unlockedAt: number;
};

export function jettonLockupConfigToCell(config: JettonLockupConfig): Cell {
    return beginCell()
        .storeAddress(config.owner)
        .storeAddress(config.receiver)
        .storeUint(Math.floor(config.unlockedAt), 64)
        .storeUint(0, 1)
        .endCell();
}

export class JettonLockup implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new JettonLockup(address);
    }

    static createFromConfig(config: JettonLockupConfig, code: Cell, workchain = 0) {
        const data = jettonLockupConfigToCell(config);
        const init = { code, data };
        return new JettonLockup(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender) {
        const value = toNano('0.05')
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATLY,
            body: beginCell().storeUint(0xd53276db, 32).storeUint(0, 64).endCell(),
        });
    }

    async getLockupData(provider: ContractProvider) {
        const { stack } = await provider.get("lockup_data", []);
        return [stack.readAddress(), stack.readAddress(), stack.readNumber()];
    }
}
