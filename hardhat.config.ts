import "@matterlabs/hardhat-zksync-solc";
import "@nomicfoundation/hardhat-toolbox" ;
import "@nomicfoundation/hardhat-chai-matchers"
import { HardhatUserConfig } from "hardhat/config";

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
