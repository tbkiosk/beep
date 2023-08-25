import { expect } from 'chai'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { ethers } from 'hardhat'

describe('Beep', () => {
    async function deployContract() {
        const [owner, account1, account2] = await ethers.getSigners()

        const Beep = await ethers.getContractFactory('Beep')
        const defaultAdmin = await owner.getAddress()
        const beep = await Beep.deploy(
            defaultAdmin,
            'Beep',
            'BEEP',
            defaultAdmin,
            25,
            defaultAdmin
        );

        return { beep, owner, account1, account2 }
    }

    describe('claim quantity', () => {
        it('should be able to update quantityPerClaim', async () => {
            const { beep, account1 } = await loadFixture(deployContract)
            const quantity = await beep.quantityPerClaim()
            expect(quantity).to.equal(BigInt(1))
            await beep.setQuantityPerClaim(10)
            const newQuantity = await beep.quantityPerClaim()
            expect(newQuantity).to.equal(BigInt(10))
        })
    })
})
