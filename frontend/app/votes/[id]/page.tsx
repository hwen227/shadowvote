"use client";

import { useState, use, useEffect, useCallback } from "react";
import { useCurrentAccount, useSignPersonalMessage } from "@mysten/dapp-kit";
import { getVotePoolById } from "@/contracts/query";
import { SuiVotePool, WalrusVotePool } from "@/types";
import { SessionKey } from "@mysten/seal";
import { networkConfig } from "@/contracts";
import VoteDecryptedDetails from "./components/VoteDecryptedDetails";
import VoteCast from "./components/VoteCast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getRemainingTime } from "@/lib/utils";

export default function VoteDetailPage({ params }: { params: { id: string } }) {
    const [votePoolObjectData, setVotePoolObjectData] = useState<SuiVotePool | null>(null);
    const [decryptedVotePoolData, setDecryptedVotePoolData] = useState<WalrusVotePool | null>(null);
    const [voteNotFound, setVoteNotFound] = useState(false);
    const [currentSessionKey, setCurrentSessionKey] = useState<SessionKey | null>(null);
    const [isSigningMessage, setIsSigningMessage] = useState(false);

    const voteId = params instanceof Promise
        ? use(params).id
        : params.id;
    const currentAccount = useCurrentAccount();
    const { mutate: signPersonalMessage } = useSignPersonalMessage();

    const fetchVoteData = useCallback(async () => {
        try {
            const suiVotePoolData = await getVotePoolById(voteId);

            ///TODO:判断找到的object的类型
            if (!suiVotePoolData) {
                setVoteNotFound(true);
            }
            setVotePoolObjectData(suiVotePoolData);
        } catch (error) {
            console.error("Error fetching vote data:", error);
            setVoteNotFound(true);
        }
    }, [voteId]);

    const handleDecryptSuccess = (decryptedData: WalrusVotePool) => {
        setDecryptedVotePoolData(decryptedData);
    };

    const signSessionKey = useCallback(async () => {
        if (!currentAccount) {
            return;
        }

        setIsSigningMessage(true);

        try {
            const sessionKey = new SessionKey({
                address: currentAccount.address,
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
                        setIsSigningMessage(false);
                    },
                    onError: (error) => {
                        console.error('签名失败:', error);
                        setIsSigningMessage(false);
                    }
                }
            );
        } catch (error) {
            console.error('签名失败:', error);
            setIsSigningMessage(false);
        }
    }, [currentAccount, signPersonalMessage]);

    useEffect(() => {
        fetchVoteData();
        // 当账户变化时重置状态
        setCurrentSessionKey(null);
        setDecryptedVotePoolData(null);
    }, [currentAccount, fetchVoteData]);

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

    return (
        <div className="container max-w-3xl mx-auto px-4 py-8">

            <div className="flex items-center mb-6">
                <Button
                    variant="outline"
                    size="icon"
                    className="mr-4"
                    asChild
                >
                    <Link href="/">
                        <i className="fas fa-arrow-left"></i>
                    </Link>
                </Button>
                <h1 className="text-xl font-medium">投票详情</h1>
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">{votePoolObjectData?.title}</h2>
                <div className="flex items-center mb-4">
                    <Badge variant="success" className="mr-3">进行中</Badge>
                    <span className="text-sm text-gray-500">
                        <i className="fas fa-clock mr-1"></i> {votePoolObjectData?.end ? getRemainingTime(votePoolObjectData.end) : ''}
                    </span>
                </div>

                {isSessionKeyValid && votePoolObjectData &&
                    <VoteDecryptedDetails
                        votePoolObjectData={votePoolObjectData}
                        voteId={voteId}
                        sessionKey={currentSessionKey}
                        decryptedVotePoolData={decryptedVotePoolData}
                        onDecryptSuccess={handleDecryptSuccess}
                    />}

                {/* 投票选择部分，只在已解密时显示 */}
                {decryptedVotePoolData && (
                    <VoteCast
                        voteId={voteId}
                        voteBoxId={votePoolObjectData?.votebox_id || ''}
                        decryptedVotePoolData={decryptedVotePoolData}
                    />
                )}

                {/* 如果没有有效的会话密钥，显示签名按钮 */}
                {!isSessionKeyValid && (
                    <div className="flex flex-col items-center justify-center py-8 border border-dashed rounded-lg mb-8">
                        <p className="text-gray-600 mb-4">签名以查看投票详情</p>
                        <button
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                            onClick={signSessionKey}
                            disabled={isSigningMessage}>
                            {isSigningMessage ? '签名中...' : '签名'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
} 