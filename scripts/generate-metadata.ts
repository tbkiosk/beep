import fs from 'fs'
const tokenIndex = 0
const numberOfNftToMint = 1000 + tokenIndex
const tokens = []
const contract = '0x10b63ea4fc1508fCD6f2C48F12A16116B4Aba91f'
const chainId = 5


for (let index = tokenIndex; index < numberOfNftToMint; index++) {
    const dataToWrite = {
        "name": `Beep #${index}`,
        "description": `Beep is an experimental NFT that instantly adds a Dollar Cost Averaging (DCA) feature to your decentralized wallet
Just mint Beep, tailor your settings, and let Beep DCA for you!
Forget waking up every Sunday morning and manually buying ETH, this is the future!`,
        "image": "ipfs://QmdvXdYCyskHwLNmdeYiUCk12oBhQsqJuepqhunyJF4EVD/main.gif",
        "animation_url": `https://beep-iframe.vercel.app/${contract}/${chainId}/${index}`,
        "external_url": `https://tbkiosk.xyz/mint/beep/settings/${index}`
    }
    tokens.push(dataToWrite)
}

fs.writeFileSync('./token-metadata.json', JSON.stringify(tokens, null, 2))
