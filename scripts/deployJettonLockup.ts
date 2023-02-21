import { toNano } from 'ton-core';
import { JettonLockup } from '../wrappers/JettonLockup';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const jettonLockup = JettonLockup.createFromConfig({}, await compile('JettonLockup'));

    await provider.deploy(jettonLockup, toNano('0.05'));

    const openedContract = provider.open(jettonLockup);

    // run methods on `openedContract`
}
