import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import { Main } from '../wrappers/Main';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import { KeyPair, mnemonicNew, mnemonicToPrivateKey, sign } from 'ton-crypto';
import { randomAddress } from '@ton-community/test-utils';
import { OpCodes } from '../helpers/OpCodes';

async function randomKp() {
  let mnemonics = await mnemonicNew();
  return mnemonicToPrivateKey(mnemonics);
}

describe('Main', () => {
    let code: Cell;
    let blockchain: Blockchain;
    let main: SandboxContract<Main>;
    let kp: KeyPair;
    let owner: SandboxContract<TreasuryContract>;

    beforeAll(async () => {
        code = await compile('Main');
    });

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        kp = await randomKp();
        owner = await blockchain.treasury('owner');

        main = blockchain.openContract(Main.createFromConfig({
          seqno: 0,
          publicKey: kp.publicKey,
          ownerAddr: owner.address
        }, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await main.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: main.address,
            deploy: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and main are ready to use
    });

    it('should accept deposit', async () => {
      const sender = await blockchain.treasury('sender');

      const depositResult = await main.sendDeposit(sender.getSender(), toNano('2'));

      console.log(sender, sender.address);


      expect(depositResult.transactions).toHaveTransaction({
        from: sender.address,
        to: main.address,
        success: true,
      });

      const balance = await main.getBalance();

      expect(balance).toBeGreaterThan(toNano('1.99'));
    });

    it('should not allow to withdraw funds if sender is not an owner', async () => {
      const sender = await blockchain.treasury('sender');

      await main.sendDeposit(sender.getSender(), toNano('2'));

      const withdrawResult = await main.sendWithdraw(sender.getSender(), toNano('0.5'), toNano('1'));

      expect(withdrawResult.transactions).toHaveTransaction({
        from: sender.address,
        to: main.address,
        success: false,
        exitCode: 411
      });

    });

    it('should change owner', async () => {
      const newOwnerAddress = randomAddress();

      const changeOwnerResult = await main.sendChangeOwner(owner.getSender(), toNano('0.5'), newOwnerAddress);

      expect(changeOwnerResult.transactions).toHaveTransaction({
        from: owner.address,
        to: main.address,
        success: true,
      });

    //   const currentOwnerAddress = await main.getOwner();

    //   expect(currentOwnerAddress).toEqualAddress(newOwnerAddress);
    });

    it('should fail on wrong signature', async () => {
      const badKp = await randomKp();

      expect.assertions(2);

      await expect(
        main.sendExtMessage(0, (buf) => sign(buf, badKp.secretKey))
      ).rejects.toThrow();

    });

    // it('should sign', async () => {

    //   const selfDestructResult = await main.sendExtMessage({
    //       opCode: Opcodes.selfdestruct,
    //       signFunc: (buf) => sign(buf, kp.secretKey),
    //       seqno: 0
    //   });

    //   expect(selfDestructResult.transactions).toHaveTransaction({
    //     from: main.address,
    //     to: owner.address,
    //   });

    // });
});