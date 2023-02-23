import { Blockchain, OpenedContract, TreasuryContract } from '@ton-community/sandbox';
import { beginCell, Cell, toNano, fromNano, Address, Dictionary } from 'ton-core';
import { JettonLockup, BalanceValue, BalancesValue } from '../wrappers/JettonLockup';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import { JettonRoot } from "../wrappers/JettonRoot";

describe('JettonLockup', () => {
    let jettonLockupCode: Cell;
    let blockchain: Blockchain;
    let owner: OpenedContract<TreasuryContract>, receiver: OpenedContract<TreasuryContract>;

    let jettonRoot: OpenedContract<JettonRoot>, jettonLockup: OpenedContract<JettonLockup>;
    let lockupWalletAddress: Address;

    beforeAll(async () => {
        jettonLockupCode = await compile('JettonLockup');
        blockchain = await Blockchain.create();
        owner = await blockchain.treasury('owner');
        receiver = await blockchain.treasury('receiver');
    });

    it('should deploy & mint test coins', async () => {
        jettonRoot = blockchain.openContract(
            JettonRoot.createFromConfig({
                    owner: owner.address,
                }
            ));
        

        let deployResult = await jettonRoot.sendDeploy(owner.getSender());
        expect(deployResult.transactions).toHaveTransaction({
            from: owner.address,
            to: jettonRoot.address,
            deploy: true,
        });

        jettonLockup = blockchain.openContract(
            JettonLockup.createFromConfig({
                owner: owner.address,
                receiver: receiver.address,
                unlockedAt: (Date.now() / 1000) + 5,
            }, jettonLockupCode)
        );
        deployResult = await jettonLockup.sendDeploy(owner.getSender(), [await jettonRoot.getWalletAddress(jettonLockup.address)]);
        expect(deployResult.transactions).toHaveTransaction({
            from: owner.address,
            to: jettonLockup.address,
            deploy: true,
        });

        let mintResult = await jettonRoot.send(
            owner.getSender(), toNano('0.1'),
            beginCell()
                .storeUint(21, 32)
                .storeUint(0, 64)
                .storeAddress(owner.address)
                .storeCoins(toNano('0.07'))
                .storeRef(
                    beginCell()
                        .storeUint(0x178d4519, 32)
                        .storeUint(0, 64)
                        .storeCoins(toNano('1000000'))
                        .storeAddress(null)
                        .storeAddress(null)
                        .storeCoins(toNano('0.02'))
                        .storeUint(0, 1)
                        .endCell()
                )
                .endCell()
        );
        expect(fromNano(await jettonRoot.getSupply())).toBe("1000000")
        expect(mintResult.transactions).toHaveTransaction({
            from: owner.address,
            to: jettonRoot.address,
            success: true,
        });
    });

    it('put jettons in lockup', async () => {
        let ownerWalletAddress = await jettonRoot.getWalletAddress(owner.address);
        lockupWalletAddress = await jettonRoot.getWalletAddress(jettonLockup.address);
        console.log("Sending jettons to lockup");
        let sendResult = await owner.send({
            'to': ownerWalletAddress,
            'value': toNano('0.1'),
            'body': beginCell()
                .storeUint(0xf8a7ea5, 32)
                .storeUint(0, 64)
                .storeCoins(toNano('1000'))
                .storeAddress(jettonLockup.address)
                .storeAddress(owner.address)
                .storeUint(0, 1)
                .storeCoins(toNano('0.05'))
                .storeUint(0, 1)
                .endCell()
        });
        let {stack} = (await blockchain.getContract(lockupWalletAddress)).get('get_wallet_data');
        if (stack[0].type == 'int') {
            console.log("Jettons in lockup: ", stack[0].value);
        }

        let lockupData = await jettonLockup.getLockupData();
        expect(lockupData[0].toString()).toBe(owner.address.toString());
        expect(lockupData[1].toString()).toBe(receiver.address.toString());

        let accountState = (await blockchain.getContract(jettonLockup.address)).accountState;
        if (accountState?.type !== 'active') throw new Error('Contract is not active');
        let accountData = accountState.state.data;
        if (!accountData) throw new Error('Contract has invalid data');
        const storedJettonBalance = accountData.beginParse().loadDict(Dictionary.Keys.Buffer(32), BalancesValue).values()[0].balance;
        expect(storedJettonBalance).toBe(1000000000000n);
    });

    it('can\'t withdraw locked coins', async () => {
        let withdrawResult = await receiver.send({
            'to': jettonLockup.address,
            'value': toNano('0.1'),
            'body': beginCell()
                .storeUint(0xb5de5f9e, 32)
                .storeUint(0, 64)
                .storeRef(
                    beginCell()
                        .storeAddress(lockupWalletAddress)
                        .storeCoins(toNano('0.05'))
                        .storeMaybeRef(
                            beginCell()
                                .storeUint(0xf8a7ea5, 32)
                                .storeUint(0, 64)
                                .storeCoins(toNano('500'))
                                .storeAddress(receiver.address)
                                .storeAddress(receiver.address)
                                .storeUint(0, 1)
                                .storeCoins(1)
                                .storeUint(0, 1)
                                .endCell()
                        )
                        .endCell()
                )
                .endCell()
        });
        expect(withdrawResult.transactions).toHaveTransaction({
            from: receiver.address,
            to: jettonLockup.address,
            success: false
        });
        let {stack} = (await blockchain.getContract(lockupWalletAddress)).get('get_wallet_data');
        if (stack[0].type == 'int') {
            console.log("Jettons in lockup: ", stack[0].value);
            expect(stack[0].value / BigInt(10 ** 9)).toBe(1000n);
        }
    });

    jest.setTimeout(10000);
    it('withdraw locked coins after lock', async () => {
        await new Promise(f => setTimeout(f, 5000));
        let withdrawResult = await receiver.send({
            'to': jettonLockup.address,
            'value': toNano('0.1'),
            'body': beginCell()
                .storeUint(0xb5de5f9e, 32)
                .storeUint(0, 64)
                .storeRef(
                    beginCell()
                        .storeAddress(lockupWalletAddress)
                        .storeCoins(toNano('0.05'))
                        .storeMaybeRef(
                            beginCell()
                                .storeUint(0xf8a7ea5, 32)
                                .storeUint(0, 64)
                                .storeCoins(toNano('500'))
                                .storeAddress(receiver.address)
                                .storeAddress(receiver.address)
                                .storeUint(0, 1)
                                .storeCoins(1)
                                .storeUint(0, 1)
                                .endCell()
                        )
                        .endCell()
                )
                .endCell()
        });
        expect(withdrawResult.transactions).toHaveTransaction({
            from: receiver.address,
            to: jettonLockup.address,
            success: true
        });
        let {stack} = (await blockchain.getContract(lockupWalletAddress)).get('get_wallet_data');
        if (stack[0].type == 'int') {
            console.log("Jettons in lockup: ", stack[0].value);
            expect(stack[0].value / BigInt(10 ** 9)).toBe(500n);
        }

        let accountState = (await blockchain.getContract(jettonLockup.address)).accountState;
        if (accountState?.type !== 'active') throw new Error('Contract is not active');
        let accountData = accountState.state.data;
        if (!accountData) throw new Error('Contract has invalid data');
        const storedJettonBalance = accountData.beginParse().loadDict(Dictionary.Keys.Buffer(32), BalancesValue).values()[0].balance;
        expect(storedJettonBalance).toBe(500000000000n);
    });

    it('lockup can drop onchain data', async () => {
        let requestResult = await receiver.send({
            'to': jettonLockup.address,
            'value': toNano('0.2'),
            'body': beginCell()
                .storeUint(0x7a4c6d4a, 32)
                .storeUint(10, 64)
                .endCell()
        });
        let accountState = (await blockchain.getContract(jettonLockup.address)).accountState;
        if (accountState?.type !== 'active') throw new Error('Contract is not active');
        let accountData = accountState.state.data;
        if (!accountData) throw new Error('Contract has invalid data');
        expect(requestResult.transactions).toHaveTransaction({
            from: jettonLockup.address,
            to: receiver.address,
            body: beginCell()
                .storeUint(0x7a4c6d4a, 32)
                .storeUint(10, 64)
                .storeRef(accountData).endCell(),
            success: true,
        });
    });

    it('extend lock time & can\'t withdraw after', async () => {
        let storedTimer = (await jettonLockup.getLockupData())[2];
        let extendResult = await owner.send({
            'to': jettonLockup.address,
            'value': toNano('0.1'),
            'body': beginCell()
                .storeUint(0xceba1400, 32)
                .storeUint(0, 64)
                .storeUint(1800, 64)
                .endCell()
        });
        expect(storedTimer).toBe((await jettonLockup.getLockupData())[2]);

        extendResult = await owner.send({
            'to': jettonLockup.address,
            'value': toNano('0.1'),
            'body': beginCell()
                .storeUint(0xceba1400, 32)
                .storeUint(0, 64)
                .storeUint(storedTimer + 1800, 64)
                .endCell()
        });
        expect(extendResult.transactions).toHaveTransaction({
            from: owner.address,
            to: jettonLockup.address,
            success: true
        });

        let withdrawResult = await receiver.send({
            'to': jettonLockup.address,
            'value': toNano('0.1'),
            'body': beginCell()
                .storeUint(0xb5de5f9e, 32)
                .storeUint(0, 64)
                .storeRef(
                    beginCell()
                        .storeAddress(lockupWalletAddress)
                        .storeCoins(toNano('0.05'))
                        .storeMaybeRef(
                            beginCell()
                                .storeUint(0xf8a7ea5, 32)
                                .storeUint(0, 64)
                                .storeCoins(toNano('300'))
                                .storeAddress(receiver.address)
                                .storeAddress(receiver.address)
                                .storeUint(0, 1)
                                .storeCoins(1)
                                .storeUint(0, 1)
                                .endCell()
                        )
                        .endCell()
                )
                .endCell()
        });
        expect(withdrawResult.transactions).toHaveTransaction({
            from: receiver.address,
            to: jettonLockup.address,
            success: false
        });
        let {stack} = (await blockchain.getContract(lockupWalletAddress)).get('get_wallet_data');
        if (stack[0].type == 'int') {
            console.log("Jettons in lockup: ", stack[0].value);
            expect(stack[0].value / BigInt(10 ** 9)).toBe(500n);
        }
    });

    it('edit owner & try extend time', async () => {
        let changeResult = await owner.send({
            'to': jettonLockup.address,
            'value': toNano('0.1'),
            'body': beginCell()
                .storeUint(0xf6d29301, 32)
                .storeUint(0, 64)
                .storeAddress(null)
                .endCell()
        });
        expect(changeResult.transactions).toHaveTransaction({
            from: owner.address,
            to: jettonLockup.address,
            success: true
        });

        let extendResult = await owner.send({
            'to': jettonLockup.address,
            'value': toNano('0.1'),
            'body': beginCell()
                .storeUint(0xceba1400, 32)
                .storeUint(0, 64)
                .storeUint(1800, 64)
                .endCell()
        });
        expect(extendResult.transactions).toHaveTransaction({
            from: owner.address,
            to: jettonLockup.address,
            success: false
        });
    });

    it('edit receiver', async () => {
        let changeResult = await receiver.send({
            'to': jettonLockup.address,
            'value': toNano('0.1'),
            'body': beginCell()
                .storeUint(0x16b628bf, 32)
                .storeUint(0, 64)
                .storeAddress(owner.address)
                .endCell()
        });
        expect(changeResult.transactions).toHaveTransaction({
            from: receiver.address,
            to: jettonLockup.address,
            success: true
        });

        let { stack } = (await blockchain.getContract(jettonLockup.address)).get('lockup_data');
        if (stack[1].type !== 'slice') throw new Error('Invalid lockup data');
        expect(stack[1].cell.beginParse().loadAddress().toString()).toBe(owner.address.toString());
    });
});
