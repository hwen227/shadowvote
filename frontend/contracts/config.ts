interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'testnet' | 'mainnet';

const configs = {
    testnet: {
        packageID: "0xcd6d49b4017f2835b015078b8ad4704dd0c4b5199fa54807e4a6f1513db7412a",
        stateID: "0x3fff7de4fa016fce7e434a870d9f825cc896aecfcdba4a031a304d82b7376c48"
    },
    mainnet: {
        Package: "0x1111111111111111111111111111111111111111", //TODO
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}