import { Address, beginCell, toNano } from 'ton-core';
import { JettonLockup } from '../wrappers/JettonLockup';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const jettonLockup = JettonLockup.createFromConfig(
        {
            owner: Address.parse("EQC_UQzCLJniVUDD4AD_uM8_cf22T7-QIHTy3zzfogCtO05A"),
            receiver: Address.parse("EQC_UQzCLJniVUDD4AD_uM8_cf22T7-QIHTy3zzfogCtO05A"),
            unlockedAt: (Date.now() / 1000) + 5
        },
        await compile('JettonLockup')
    );
    await provider.deploy(
        jettonLockup, 
        toNano('0.05'), 
        beginCell()
            .storeUint(0xd53276db, 32)
            .storeUint(0, 64)
            .endCell()
    );
    const openedContract = provider.open(jettonLockup);
    console.log('Address:', openedContract.address)
}
