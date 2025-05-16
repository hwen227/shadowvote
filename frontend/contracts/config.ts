interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'testnet' | 'mainnet';

const configs = {
    testnet: {
        packageID: "0xbdccbd705d5847db445395182466e9732d15320f3af7a1364084a9c7f6e53fb3",
        stateID: "0xe37e96a68050f5edac656bcda6504ec4cb3ddcd8f7a9606f5822eee37d0b377b"
    },
    mainnet: {
        Package: "0x1111111111111111111111111111111111111111", //TODO
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}