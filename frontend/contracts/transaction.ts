import { SuiVotePool } from "@/types"
import { Transaction } from "@mysten/sui/transactions"
import { networkConfig } from "."

export const createVotePoolTx = (votepool: SuiVotePool): Transaction => {
    const tx = new Transaction();

    tx.moveCall({
        package: networkConfig.testnet.variables.packageID,
        module: "shadowvote",
        function: "create_vote_pool_entry",
        arguments: [
            tx.object(networkConfig.testnet.variables.stateID),
            tx.pure.string(votepool.blob_id),
            tx.pure.id(votepool.allowlist_id),
            tx.pure.string(votepool.title),
            tx.pure.u64(votepool.start),
            tx.pure.u64(votepool.end),
        ]
    })

    return tx;
}

export const createAllowlisTx = async (name: string) => {
    const tx = new Transaction();

    tx.moveCall({
        package: networkConfig.testnet.variables.packageID,
        module: "allowlist",
        function: "create_allowlist_entry",
        arguments: [
            tx.pure.string(name)
        ]
    });

    return tx;
}

export const allowListAdd = async (tx: Transaction, allowlistId: string, allowlistCap: string, address: string) => {

    tx.moveCall({
        target: `${networkConfig.testnet.variables.packageID}::allowlist::add`,
        arguments: [
            tx.object(allowlistId),
            tx.object(allowlistCap),
            tx.pure.address(address),
        ]
    })

    return tx;
}

export const allowListRemove = async (tx: Transaction, allowlistId: string, allowlistCap: string, address: string) => {

    tx.moveCall({
        target: `${networkConfig.testnet.variables.packageID}::allowlist::remove`,
        arguments: [
            tx.object(allowlistId),
            tx.object(allowlistCap),
            tx.pure.address(address),
        ]
    })

    return tx;
}
export const allowlistMultiAdd = async (tx: Transaction, allowlistId: string, allowlistCap: string, addresses: string[]) => {
    tx.moveCall({
        target: `${networkConfig.testnet.variables.packageID}::allowlist::batch_add`,
        arguments: [
            tx.object(allowlistId),
            tx.object(allowlistCap),
            tx.pure.vector('address', addresses)
        ]
    }
    );
    return tx;
}

export const allowListMultiRemove = async (tx: Transaction, allowlistId: string, allowlistCap: string, addresses: string[]) => {

    tx.moveCall({
        target: `${networkConfig.testnet.variables.packageID}::allowlist::batch_remove`,
        arguments: [
            tx.object(allowlistId),
            tx.object(allowlistCap),
            tx.pure.vector('address', addresses)
        ]
    })

    return tx;
}

export const castVoteTx = async (votePoolId: string, votebox: string, vote: Uint8Array) => {
    const tx = new Transaction();

    tx.moveCall({
        target: `${networkConfig.testnet.variables.packageID}::shadowvote::cast_vote`,
        arguments: [
            tx.object(votePoolId),
            tx.object(votebox),
            tx.pure.vector('u8', vote),
            tx.object("0x6"),
        ]
    })

    return tx;
}


