import { expect } from 'chai'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { ethers } from 'hardhat'

describe('Beep', () => {
    const nativeCurrency = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'


    async function deployContract() {
        const [owner, account1 ] = await ethers.getSigners()

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

        await beep.lazyMint(
            BigInt(100),
            'https://initial.com/',
            '0x',
        )

        const claimConditions = {
            "startTimestamp": BigInt(0),
            "maxClaimableSupply": BigInt(100),
            "supplyClaimed": BigInt(0),
            "quantityLimitPerWallet": BigInt(20),
            "merkleRoot": ethers.encodeBytes32String(''),
            "pricePerToken": BigInt(0),
            "currency": nativeCurrency,
            "metadata": '0x',
        }

        await beep.setClaimConditions(
            claimConditions,
            false,
        )

        return { beep, owner, account1, account2 }
    }

    describe('claim quantity', () => {
        it('should be able to update quantityPerClaim', async () => {
            const { beep } = await loadFixture(deployContract)
            const quantity = await beep.quantityPerClaim()
            expect(quantity).to.equal(BigInt(1))
            await beep.setQuantityPerClaim(10)
            const newQuantity = await beep.quantityPerClaim()
            expect(newQuantity).to.equal(BigInt(10))
        })

        it('should be able to claim under quantity limit', async () => {
            const { beep, owner } = await loadFixture(deployContract)

            await beep.claim(
                owner.getAddress(),
                BigInt(1),
                nativeCurrency,
                BigInt(0),
                {
                    proof: [],
                    quantityLimitPerWallet: BigInt(20),
                    pricePerToken: BigInt(0),
                    currency: nativeCurrency,
                },
                '0x'
            )
            const balance = await beep.balanceOf(owner.getAddress())
            expect(balance).to.equal(BigInt(1))
        })

        it('should not be able to claim over quantity limit', async () => {
            const { beep, owner } = await loadFixture(deployContract)
            await beep.setQuantityPerClaim(3)

           await expect(beep.claim(
                owner.getAddress(),
                BigInt(4),
                nativeCurrency,
                BigInt(0),
                {
                    proof: [],
                    quantityLimitPerWallet: BigInt(20),
                    pricePerToken: BigInt(0),
                    currency: nativeCurrency,
                },
                '0x'
            )).to.be.revertedWith('Too many tokens claimed at once')
        })

        it('should be able to set custom base token url', async () => {
            const { beep, owner } = await loadFixture(deployContract)

            await beep.claim(
                owner.getAddress(),
                BigInt(1),
                nativeCurrency,
                BigInt(0),
                {
                    proof: [],
                    quantityLimitPerWallet: BigInt(20),
                    pricePerToken: BigInt(0),
                    currency: nativeCurrency,
                },
                '0x'
            )
            const tokenURI = await beep.tokenURI(0)
            expect(tokenURI).to.equal('https://initial.com/0')

            await beep.setGlobalBaseURI('https://new.com/')
            const newTokenURI = await beep.tokenURI(0)
            expect(newTokenURI).to.equal('https://new.com/0')
        })
    })
})
