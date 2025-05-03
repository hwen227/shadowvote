interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'testnet' | 'mainnet';

const configs = {
    testnet: {
        packageID: "0x74a2a8377ff7674c3310ddcae52c5dec6cd1441203c435f30d504feed51b44eb",
        stateID: "0x2d27dd0c1a40b6bb76f91e8a14d24842e21c776de36b22378b14e3908d68cf91"
    },
    mainnet: {
        Package: "0x1111111111111111111111111111111111111111", //TODO
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}