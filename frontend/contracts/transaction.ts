import { SuiInputVotePool } from "@/types"
import { Transaction } from "@mysten/sui/transactions"
import { networkConfig, suiClient } from "."

export const createVotePoolTx = (votepool: SuiInputVotePool): Transaction => {

    if (!(votepool.details instanceof Uint8Array) || !votepool.allowlist_Id) {
        throw new Error("Invalid vote pool data");
    }
    const tx = new Transaction();

    tx.moveCall({
        package: networkConfig.testnet.variables.packageID,
        module: "shadowvote",
        function: "create_vote_pool_entry",
        arguments: [
            tx.object(networkConfig.testnet.variables.stateID),
            tx.pure.vector('u8', votepool.details),
            tx.object(votepool.allowlist_Id),
            tx.pure.string(votepool.title),
            tx.pure.u64(votepool.start),
            tx.pure.u64(votepool.end),
        ]
    })

    return tx;
}

export const createVotePoolTx_woal = (votepool: SuiInputVotePool): Transaction => {

    if (typeof votepool.details !== 'string') {
        throw new Error("Invalid vote pool data");
    }
    const tx = new Transaction();

    tx.moveCall({
        package: networkConfig.testnet.variables.packageID,
        module: "votepool_wo_al",
        function: "create_vote_pool_entry",
        arguments: [
            tx.object(networkConfig.testnet.variables.stateID),
            tx.pure.string(votepool.details),
            tx.pure.string(votepool.title),
            tx.pure.u64(votepool.start),
            tx.pure.u64(votepool.end),
        ]
    })

    return tx;
}

export const createVotePoolTx_nft = (votepool: SuiInputVotePool): Transaction => {

    if (!(votepool.details instanceof Uint8Array) || !votepool.nft_id || !votepool.nft_type) {
        throw new Error("Invalid vote pool data");
    }
    const tx = new Transaction();

    tx.moveCall({
        package: networkConfig.testnet.variables.packageID,
        module: "nft_voting",
        function: "create_vote_pool_entry",
        typeArguments: [votepool.nft_type],
        arguments: [
            tx.object(networkConfig.testnet.variables.stateID),
            tx.pure.vector('u8', votepool.details),
            tx.object(votepool.nft_id),
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

export const castVoteTx = async (votePoolId: string, votebox: string, vote: Uint8Array, is_anonymous: boolean) => {
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

export const castVoteTx_woal = async (votePoolId: string, votebox: string, vote: Uint8Array, is_anonymous: boolean) => {
    const tx = new Transaction();

    tx.moveCall({
        target: `${networkConfig.testnet.variables.packageID}::votepool_wo_al::cast_vote`,
        arguments: [
            tx.object(votePoolId),
            tx.object(votebox),
            tx.pure.vector('u8', vote),
            tx.object("0x6"),
        ]
    })

    return tx;
}

export const castVoteTx_with_nft = async (votePoolId: string, votebox: string, vote: Uint8Array) => {
    const tx = new Transaction();

    tx.moveCall({
        target: `${networkConfig.testnet.variables.packageID}::nft_voting::cast_vote`,
        arguments: [
            tx.object(votePoolId),
            tx.object(votebox),
            tx.pure.vector('u8', vote),
            tx.object("0x6"),
        ]
    })

    return tx;
}

export const dry_run_has_voted = async (tx: Transaction, sender: string) => {
    try {
        tx.setSender(sender);
        const txBytesUint8Array = await tx.build({ client: suiClient });
        const txBytes = Buffer.from(txBytesUint8Array).toString('base64');

        const result = await suiClient.dryRunTransactionBlock({
            transactionBlock: txBytes
        });

        console.log('Dry run result:', result);
        return result;

    } catch (error) {

        if (typeof error === 'object' && error !== null && 'message' in error) {
            const msg = (error as any).message;
            const match = msg.match(/MoveAbort\(.*?, (\d+)\)/);
            if (match) {
                const errorCode = match[1];
                console.log('⚠️ Error code extracted:', errorCode);

                if (errorCode === '5') {
                    throw new Error('You have already voted for this vote');
                }
            }
        }
    }


};


