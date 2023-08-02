import { Address, toNano } from 'ton-core';
import { Main } from '../wrappers/Main';
import { compile, NetworkProvider } from '@ton-community/blueprint';
import { mnemonicToPrivateKey } from "ton-crypto";
import { mnemonics, wallet } from '../.config';

export async function run(provider: NetworkProvider) {
    const main = provider.open(Main.createFromConfig({
        seqno: 0,
        publicKey: (await mnemonicToPrivateKey(mnemonics)).publicKey,
        ownerAddr: Address.parse(wallet)
    }, await compile('Main')));

    await main.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(main.address);

    // run methods on `main`
}
