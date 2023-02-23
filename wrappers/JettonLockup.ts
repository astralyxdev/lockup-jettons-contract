import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode, toNano, Dictionary, DictionaryValue } from 'ton-core';

export type JettonLockupConfig = {
    owner: Address;
    receiver: Address;
    unlockedAt: number;
};

export type BalanceValue = {
    balance: bigint
};

export const BalancesValue: DictionaryValue<BalanceValue> = {
    serialize: (src: BalanceValue, builder) => {
        builder
            .storeCoins(src.balance)
    },
    parse: (src) => {
        return {
            balance: src.loadCoins(),
        }
    },
};

export function jettonLockupConfigToCell(config: JettonLockupConfig): Cell {
    return beginCell()
        .storeUint(0, 1)
        .storeAddress(config.owner)
        .storeAddress(config.receiver)
        .storeUint(Math.floor(config.unlockedAt), 64)
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

    async sendDeploy(provider: ContractProvider, via: Sender, supportedWallets: Address[]) {
        let jettonBalances = Dictionary.empty(Dictionary.Keys.Buffer(32), BalancesValue); 
        for (let _wallet of supportedWallets)
            jettonBalances.set(_wallet.hash, { balance: toNano('0') });

        await provider.internal(via, {
            value: toNano('0.2'),
            sendMode: SendMode.PAY_GAS_SEPARATLY,
            body: beginCell().storeUint(0, 32 + 64).storeDict(jettonBalances).endCell(),
        });
    }

    async getLockupData(provider: ContractProvider): Promise<[Address, Address, number]> {
        const { stack } = await provider.get("lockup_data", []);
        return [stack.readAddress(), stack.readAddress(), stack.readNumber()];
    }

    async sendTransfer(provider: ContractProvider, via: Sender, to: Address) {
        await provider.internal(
            via,
            {
                value: toNano('0.1'),
                sendMode: SendMode.PAY_GAS_SEPARATLY,
                body: beginCell()
                    .storeUint(0xf8a7ea5, 32)
                    .storeUint(0, 64)
                    .storeCoins(toNano('1000'))
                    .storeAddress(this.address)
                    .storeAddress(to)
                    .storeUint(0, 1)
                    .storeCoins(1)
                    .storeCoins(toNano('0.05'))
                    .storeUint(0, 1)
                    .endCell()
            }
        )
    }

    async withdraw(provider: ContractProvider, via: Sender, to: Address, jettonWalletAddress: Address) {
        await provider.internal(
            via,
            {
                value: toNano('0.1'),
                sendMode: SendMode.PAY_GAS_SEPARATLY,
                body: beginCell()
                .storeUint(0xb5de5f9e, 32)
                .storeUint(0, 64)
                .storeRef(
                    beginCell()
                        .storeAddress(jettonWalletAddress)
                        .storeCoins(toNano('0.05'))
                        .storeRef(
                            beginCell()
                                .storeUint(0xf8a7ea5, 32)
                                .storeUint(0, 64)
                                .storeCoins(toNano('500'))
                                .storeAddress(to)
                                .storeAddress(to)
                                .storeUint(0, 1)
                                .storeCoins(1)
                                .storeUint(0, 1)
                                .endCell()
                        )
                        .endCell()
                )
                .endCell()
            }
        )
    }
}
