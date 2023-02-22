import { Blockchain, OpenedContract, TreasuryContract } from '@ton-community/sandbox';
import { beginCell, Cell, toNano, fromNano, Address } from 'ton-core';
import { JettonLockup } from '../wrappers/JettonLockup';
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
        await blockchain.setVerbosityForAddress(jettonLockup.address, {
            blockchainLogs: true,
            vmLogs: 'vm_logs',
        })
        deployResult = await jettonLockup.sendDeploy(owner.getSender());
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
                .storeCoins(toNano('0.05'))
                .storeRef(
                    beginCell()
                        .storeUint(0x178d4519, 32)
                        .storeUint(0, 64)
                        .storeCoins(toNano('1000000'))
                        .storeAddress(null)
                        .storeAddress(null)
                        .storeCoins(0)
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
                .storeCoins(1)
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

        // console.log(typeof(lockupData[3]), lockupData[3]);
        // let jettonBalances = Dictionary.load(Dictionary.Keys.Uint(256), Dictionary.Values.Cell(), lockupData[3]);

        // TODO: make extract stored values from dict result.stack[3]
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
                        .storeRef(
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
                        .storeRef(
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
    });
});
