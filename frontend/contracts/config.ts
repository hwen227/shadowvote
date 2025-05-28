interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'testnet' | 'mainnet';

const configs = {
    testnet: {
        packageID: "0x491d05896ebe4f9ef9e91724379a88c746847054d9d0c292608dde7aed2638af",
        stateID: "0x775c302a1e458a7c237a7a2cda4a0ee0fd2adcf9e42b607402000aeef2f99362"
    },
    mainnet: {
        Package: "0x1111111111111111111111111111111111111111", //TODO
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}