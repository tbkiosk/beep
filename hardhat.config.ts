import "@matterlabs/hardhat-zksync-solc";
import "@nomicfoundation/hardhat-toolbox" ;
import "@nomicfoundation/hardhat-chai-matchers"
import { HardhatUserConfig } from "hardhat/config";
import DotEnv from 'dotenv'

DotEnv.config()

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY

const config: HardhatUserConfig = {
    zksolc: {
        version: "1.3.9",
        compilerSource: "binary",
        settings: {
            optimizer: {
                enabled: true,
            },
        },
    },
    networks: {
        zksync_testnet: {
            url: "https://zksync2-testnet.zksync.dev",
            // @ts-ignore
            ethNetwork: "goerli",
            chainId: 280,
            zksync: true,
        },
        zksync_mainnet: {
            url: "https://zksync2-mainnet.zksync.io/",
            // @ts-ignore
            ethNetwork: "mainnet",
            chainId: 324,
            zksync: true,
        },
        hardhat: {
            forking: {
                url: `https://eth-goerli.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
                blockNumber: 9957488

            }
        }
    },
    paths: {
        artifacts: "./artifacts-zk",
        cache: "./cache-zk",
        sources: "./contracts",
        tests: "./test",
    },
    solidity: {
        version: "0.8.17",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
}

export default config
