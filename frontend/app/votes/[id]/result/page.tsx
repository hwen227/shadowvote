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

export default function VoteResultPage({ params }: { params: { id: string } }) {

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
            <div className="container mx-auto p-4 text-center">
                <p className="mt-4 text-lg">请先连接钱包后继续操作</p>
            </div>
        );
    }

    if (voteNotFound) {
        return (
            <div className="container max-w-3xl mx-auto px-4 py-8">
                <div className="flex items-center mb-6">
                    <h1 className="text-xl font-medium">投票详情</h1>
                </div>
                <div className="text-center p-8 border border-dashed rounded-lg">
                    <p className="text-xl text-gray-600 mb-4">抱歉，该投票池不存在</p>
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
        <>
            <VoteHeader votePoolObjectData={votePoolObjectData} title="投票结果" />

            <div className="container max-w-3xl mx-auto px-4">
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
                        <p className="text-gray-600 mb-4">需要签名才能查看投票结果</p>
                        <button
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                            onClick={signSessionKey}>
                            签名
                        </button>
                    </div>
                )}
            </div>
        </>
    );
} 