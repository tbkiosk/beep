import { expect } from 'chai'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { ethers } from 'hardhat'

describe('Beep', () => {
    const nativeCurrency = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
    const registry = '0x284be69BaC8C983a749956D7320729EB24bc75f9'
    const implementation = '0xABF81898FEA21aAa5EE27F6fA0398a217a29bE9f'


    async function deployContract() {
        const [owner, account1] = await ethers.getSigners()

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

        const USDC = await ethers.getContractFactory('USDC')
        const usdc = await USDC.deploy()
        await usdc.approve(beep.getAddress(), BigInt(1_000_000_000_000_000));

        return { beep, owner, account1, usdc }
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

    describe('claim and deploy and token transfer', () => {
        it('should be able to claim, deploy tba and transfer token', async () => {
            const { beep, owner, usdc } = await loadFixture(deployContract)
            const tbaAddress = '0x19a7A4d3e20ed817bBf60741Ec002B020dCeC62B'
            const usdcDeposit = BigInt(1000)
            const usdcAddress = await usdc.getAddress()

            const claimAndCreateArgs = {
                receiver: owner.getAddress(),
                quantity: BigInt(1),
                currency: nativeCurrency,
                pricePerToken: BigInt(0),
                allowlistProof: {
                    proof: [],
                    quantityLimitPerWallet: BigInt(20),
                    pricePerToken: BigInt(0),
                    currency: nativeCurrency,
                },
                data: '0x',
                registry: registry,
                implementation: implementation,
                salt: ethers.encodeBytes32String('0'),
                chainId: 5,
                tokenToTransfer: usdcAddress,
                amountToTransfer: usdcDeposit,
            }
            const preDeployTbaByteCode = await ethers.provider.getCode(tbaAddress)
            const result = await beep.claimAndCreateTba(claimAndCreateArgs)
            expect(preDeployTbaByteCode).to.equal('0x')
            await expect(result).to.emit(beep, 'TokenBoundAccountCreated').withArgs(0, tbaAddress);
            const balance = await beep.balanceOf(owner.getAddress())
            expect(balance).to.equal(BigInt(1))
            const postDeployTbaBytecode = await ethers.provider.getCode(tbaAddress)
            expect(postDeployTbaBytecode).length.to.be.greaterThan(2)

            const tbaUSDCBalance = await usdc.balanceOf(tbaAddress)
            expect(tbaUSDCBalance).to.equal(usdcDeposit)
            await expect(result).to.emit(beep, 'InitialTokenTransferred').withArgs(tbaAddress, usdcDeposit, usdcAddress);
        })

        it('should not transfer token if transfer amount is 0', async () => {
            const { beep, owner, usdc } = await loadFixture(deployContract)
            const usdcAddress = await usdc.getAddress()
            const beepAddress = await beep.getAddress()

            const claimAndCreateArgs = {
                receiver: owner.getAddress(),
                quantity: BigInt(1),
                currency: nativeCurrency,
                pricePerToken: BigInt(0),
                allowlistProof: {
                    proof: [],
                    quantityLimitPerWallet: BigInt(20),
                    pricePerToken: BigInt(0),
                    currency: nativeCurrency,
                },
                data: '0x',
                registry: registry,
                implementation: implementation,
                salt: ethers.encodeBytes32String('0'),
                chainId: 5,
                tokenToTransfer: usdcAddress,
                amountToTransfer: BigInt(0),
            }

            const result = await beep.claimAndCreateTba(claimAndCreateArgs)
            await expect(result).to.emit(beep, 'TokenBoundAccountCreated')

            const allowance = await usdc.allowance(owner.getAddress(), beepAddress)
            expect(allowance).to.equal(1_000_000_000_000_000)
            await expect(result).to.not.emit(beep, 'InitialTokenTransferred')
        })

        it('should be able to claim and deploy multiple token at once', async () => {
            const { beep, owner, usdc } = await loadFixture(deployContract)
            const tbaAddress1 = '0x19a7A4d3e20ed817bBf60741Ec002B020dCeC62B'
            const tbaAddress2 = '0x70850914b1f30360e17615359E2d013de21676e7'
            const tbaAddress3 = '0x0423372d45915aD22300f82D208F265CBDE39Ff4'
            const usdcDeposit = BigInt(1000)
            const usdcAddress = await usdc.getAddress()

            const claimAndCreateArgs = {
                receiver: owner.getAddress(),
                quantity: BigInt(3),
                currency: nativeCurrency,
                pricePerToken: BigInt(0),
                allowlistProof: {
                    proof: [],
                    quantityLimitPerWallet: BigInt(20),
                    pricePerToken: BigInt(0),
                    currency: nativeCurrency,
                },
                data: '0x',
                registry: registry,
                implementation: implementation,
                salt: ethers.encodeBytes32String('0'),
                chainId: 5,
                tokenToTransfer: usdcAddress,
                amountToTransfer: BigInt(usdcDeposit),
            }

            await beep.setQuantityPerClaim(3)
            const result = await beep.claimAndCreateTba(claimAndCreateArgs)
            await expect(result)
                .to.emit(beep, 'TokenBoundAccountCreated').withArgs(0, tbaAddress1).and
                .to.emit(beep, 'TokenBoundAccountCreated').withArgs(1, tbaAddress2).and
                .to.emit(beep, 'TokenBoundAccountCreated').withArgs(2, tbaAddress3);

            const balance = await beep.balanceOf(owner.getAddress())
            expect(balance).to.equal(BigInt(3))

            const tbaUSDCBalance1 = await usdc.balanceOf(tbaAddress1)
            expect(tbaUSDCBalance1).to.equal(usdcDeposit)
            const tbaUSDCBalance2 = await usdc.balanceOf(tbaAddress2)
            expect(tbaUSDCBalance2).to.equal(usdcDeposit)
            const tbaUSDCBalance3 = await usdc.balanceOf(tbaAddress3)
            expect(tbaUSDCBalance3).to.equal(usdcDeposit)
        })
    })
})
