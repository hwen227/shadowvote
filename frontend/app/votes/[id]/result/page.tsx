"use client";

import VoteResult from "@/app/votes/[id]/components/VoteResult";
import { useState, use, useEffect, useCallback } from "react";
import { EncryptedInputVotePool } from "@/types";
import { useCurrentAccount, useSignPersonalMessage } from "@mysten/dapp-kit";
import { getVotePoolById } from "@/contracts/query";
import { SuiResponseVotePool } from "@/types";
import { SessionKey } from "@mysten/seal";
import { networkConfig } from "@/contracts";
import VoteDecryptedDetails from "../components/VoteDecryptedDetails";
import PublicVoteDetails from "../components/PublicVoteDetails";
import { Transaction } from "@mysten/sui/transactions";
import { fromHex } from "@mysten/sui/utils";
import { MoveCallConstructor } from "@/contracts/seal";
import VoteHeader from "../components/VoteHeader";
import { Button } from "@/components/ui/button";

type VoteResultPageProps = {
    params: {
        id: string
    }
}

export default function VoteResultPage({ params }: VoteResultPageProps) {

    const voteId = params instanceof Promise
        ? use(params).id
        : params.id;
    const currentAccount = useCurrentAccount();
    const [voteNotFound, setVoteNotFound] = useState(false);
    const [votePoolObjectData, setVotePoolObjectData] = useState<SuiResponseVotePool | null>(null);
    const [currentSessionKey, setCurrentSessionKey] = useState<SessionKey | null>(null);
    const { mutate: signPersonalMessage } = useSignPersonalMessage();
    const [decryptedVotePoolData, setDecryptedVotePoolData] = useState<EncryptedInputVotePool | null>(null);
    const [isAllowlist, setIsAllowlist] = useState(true);

    const fetchVoteData = useCallback(async () => {
        try {
            const [suiVotePoolData, is_allowlist] = await getVotePoolById(voteId);
            if (!suiVotePoolData) {
                setVoteNotFound(true);
            }
            setVotePoolObjectData(suiVotePoolData);
            setIsAllowlist(is_allowlist);
        } catch (error) {
            console.error("Error fetching vote data:", error);
            setVoteNotFound(true);
        }
    }, [voteId]);

    const signSessionKey = useCallback(async () => {
        if (!currentAccount) {
            return;
        }

        try {
            const sessionKey = new SessionKey({
                address: currentAccount?.address || "",
                packageId: networkConfig.testnet.variables.packageID,
                ttlMin: 10
            });

            signPersonalMessage(
                {
                    message: sessionKey.getPersonalMessage(),
                },
                {
                    onSuccess: async (result: { signature: string }) => {
                        await sessionKey.setPersonalMessageSignature(result.signature);
                        setCurrentSessionKey(sessionKey);
                    },
                    onError: (error) => {
                        console.error('签名失败:', error);

                    }
                }
            );
        } catch (error) {
            console.error('签名失败:', error);
        }
    }, [currentAccount, signPersonalMessage]);

    useEffect(() => {
        fetchVoteData();
        setCurrentSessionKey(null);
    }, [currentAccount, fetchVoteData]);

    useEffect(() => {
        if (!isAllowlist) {
            setDecryptedVotePoolData(JSON.parse(votePoolObjectData?.details as string));
        }
    }, [votePoolObjectData]);

    if (!currentAccount) {
        return (
            <div className="min-h-screen bg-black text-white">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black z-0 overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9IiM4YjVjZjYiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9wYXR0ZXJuPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')]"></div>
                </div>
                <div className="container mx-auto p-4 text-center relative z-10">
                    <p className="text-gray-300 mt-16 text-2xl font-semibold">Please Connect Your Wallet</p>
                </div>
            </div>
        );
    }

    if (voteNotFound) {
        return (

            <div className="min-h-screen bg-black text-white">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black z-0 overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9IiM4YjVjZjYiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9wYXR0ZXJuPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')]"></div>
                </div>
                <div className="container mx-auto p-4 text-center relative z-10">
                    <p className="text-gray-300 mt-16 text-2xl font-semibold">Sorry, the vote pool does not exist</p>
                </div>
            </div>
        );
    }

    // 检查sessionKey是否有效
    const isSessionKeyValid = currentSessionKey &&
        !currentSessionKey.isExpired() &&
        currentSessionKey.getAddress() === currentAccount.address;

    const handleDecryptSuccess = (decryptedData: EncryptedInputVotePool) => {
        setDecryptedVotePoolData(decryptedData);
    };

    // 为非allowlist投票创建一个自定义的moveCall
    const constructPublicMoveCall = (voteboxId: string, voteId: string): MoveCallConstructor => {
        return (tx: Transaction, id: string) => {
            tx.moveCall({
                target: `${networkConfig.testnet.variables.packageID}::votepool_wo_al::seal_approve`,
                arguments: [
                    tx.pure.vector('u8', fromHex(id)),
                    tx.object(voteboxId),
                    tx.object(voteId),
                    tx.object('0x6')
                ]
            });
        };
    };

    //为allowlist投票创建一个自定义的moveCall
    const constructMoveCall = (voteboxId: string, end: number): MoveCallConstructor => {
        return (tx: Transaction, id: string) => {
            tx.moveCall({
                target: `${networkConfig.testnet.variables.packageID}::votebox::seal_approve`,
                arguments: [
                    tx.pure.vector('u8', fromHex(id)),
                    tx.object(voteboxId),
                    tx.pure.u64(end),
                    tx.object('0x6')
                ]
            })
        }
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Animated background with tech pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black z-0 overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9IiM4YjVjZjYiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9wYXR0ZXJuPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')]"></div>
            </div>
            <div className="container mx-auto max-w-4xl px-4 py-8 relative z-10">
                <VoteHeader votePoolObjectData={votePoolObjectData} title="Vote Result" />


                {isAllowlist ? (
                    <>
                        {isSessionKeyValid && votePoolObjectData && (
                            <VoteDecryptedDetails
                                votePoolObjectData={votePoolObjectData}
                                voteId={voteId}
                                sessionKey={currentSessionKey}
                                decryptedVotePoolData={decryptedVotePoolData}
                                onDecryptSuccess={handleDecryptSuccess}
                            />
                        )}

                        {isSessionKeyValid &&
                            votePoolObjectData && decryptedVotePoolData && (
                                <VoteResult
                                    votePool={votePoolObjectData}
                                    options={decryptedVotePoolData.options}
                                    sessionKey={currentSessionKey}
                                    customMoveCall={isAllowlist ? constructMoveCall(votePoolObjectData.votebox_id, votePoolObjectData.end) : constructPublicMoveCall(votePoolObjectData.votebox_id, voteId)}
                                />
                            )}
                    </>
                ) : (
                    <>
                        <PublicVoteDetails
                            votePoolObjectData={votePoolObjectData}
                            voteId={voteId}
                        />

                        {isSessionKeyValid &&
                            votePoolObjectData && decryptedVotePoolData && (
                                <VoteResult
                                    votePool={votePoolObjectData}
                                    options={decryptedVotePoolData.options}
                                    sessionKey={currentSessionKey}
                                    customMoveCall={isAllowlist ? constructMoveCall(votePoolObjectData.votebox_id, votePoolObjectData.end) : constructPublicMoveCall(votePoolObjectData.votebox_id, voteId)}
                                />
                            )}
                    </>
                )}

                {!isSessionKeyValid && (
                    <div className="container max-w-3xl mx-auto px-4 py-8 text-center">
                        <p className="text-gray-600 mb-4">Sign to view the vote result</p>
                        <Button
                            className="px-4 py-2 bg-purple-600 border-purple-900/50 hover:bg-purple-900/20 hover:border-purple-500 text-gray-300 hover:text-purple-400"
                            onClick={signSessionKey}>
                            Sign
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
} 