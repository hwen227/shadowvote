"use client";

import { useState, use, useEffect, useCallback, useRef } from "react";
import { useCurrentAccount, useSignPersonalMessage } from "@mysten/dapp-kit";
import { getVotePoolById } from "@/contracts/query";
import { SuiResponseVotePool, EncryptedInputVotePool } from "@/types";
import { SessionKey } from "@mysten/seal";
import { networkConfig } from "@/contracts";
import VoteDecryptedDetails from "./components/VoteDecryptedDetails";
import PublicVoteDetails from "./components/PublicVoteDetails";
import VoteCast from "./components/VoteCast";
import VoteHeader from "./components/VoteHeader";
import { castVoteTx, castVoteTx_woal } from "@/contracts/transaction";
import { Button } from "@/components/ui/button";

type VoteDetailPageProps = {
    params: {
        id: string
    }
}

export default function VoteDetailPage({ params }: VoteDetailPageProps) {
    const [votePoolObjectData, setVotePoolObjectData] = useState<SuiResponseVotePool | null>(null);
    const [decryptedVotePoolData, setDecryptedVotePoolData] = useState<EncryptedInputVotePool | null>(null);
    const [voteNotFound, setVoteNotFound] = useState(false);
    const [currentSessionKey, setCurrentSessionKey] = useState<SessionKey | null>(null);
    const [isSigningMessage, setIsSigningMessage] = useState(false);
    const [detail, setDetail] = useState<EncryptedInputVotePool | null>(null)
    const [isAllowlist, setIsAllowlist] = useState(true);

    const voteId = params instanceof Promise
        ? use(params).id
        : params.id;
    const currentAccount = useCurrentAccount();
    const { mutate: signPersonalMessage } = useSignPersonalMessage();
    const prevAccountRef = useRef<string | null>(null);

    // 监听账户变化并刷新页面
    useEffect(() => {
        if (prevAccountRef.current !== null &&
            prevAccountRef.current !== currentAccount?.address) {
            // 账户已变化，刷新页面
            window.location.reload();
        }
        // 保存当前账户地址以便下次比较
        prevAccountRef.current = currentAccount?.address || null;
    }, [currentAccount]);

    const fetchVoteData = useCallback(async () => {
        try {
            const [suiVotePoolData, is_allowlist] = await getVotePoolById(voteId);
            console.log("is_allowlist", is_allowlist);

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

    const handleDecryptSuccess = (decryptedData: EncryptedInputVotePool) => {
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
        const init = async () => {
            await fetchVoteData();
            setCurrentSessionKey(null);
            setDecryptedVotePoolData(null);
        };

        init();
    }, [currentAccount, fetchVoteData]);

    // 添加新的 useEffect 来处理 details 的解析
    useEffect(() => {
        if (!isAllowlist && votePoolObjectData && typeof votePoolObjectData.details === 'string') {
            try {
                const parsedDetails = JSON.parse(votePoolObjectData.details);
                setDetail(parsedDetails);
            } catch (error) {
                console.error('解析 details 失败:', error);
            }
        }
    }, [isAllowlist, votePoolObjectData]);

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

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Animated background with tech pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black z-0 overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9IiM4YjVjZjYiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9wYXR0ZXJuPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')]"></div>
            </div>
            <div className="container mx-auto max-w-4xl px-4 py-8 relative z-10">
                <VoteHeader votePoolObjectData={votePoolObjectData} />

                {/* 根据投票类型决定显示哪种组件 */}
                {isAllowlist ? (
                    // 需要验证的投票
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

                        {/* 如果没有有效的会话密钥，显示签名按钮 */}
                        {!isSessionKeyValid && (
                            <div className="flex flex-col items-center justify-center py-8 border border-purple-900/50 bg-black/30 backdrop-blur-sm rounded-lg mb-8">
                                <p className="text-gray-400 mb-4">This vote requires identity verification, please sign to view vote details</p>
                                <Button
                                    onClick={signSessionKey}
                                    className="bg-purple-500 hover:bg-purple-600">
                                    {isSigningMessage ? 'Signing...' : 'Sign'}
                                </Button>
                            </div>
                        )}

                        {/* 投票选择部分，只在已解密时显示 */}
                        {decryptedVotePoolData && (
                            <VoteCast
                                voteId={voteId}
                                voteBoxId={votePoolObjectData?.votebox_id || ''}
                                decryptedVotePoolData={decryptedVotePoolData}
                                customCastVoteTx={castVoteTx}
                            />
                        )}
                    </>
                ) : (
                    // 公开投票，不需要验证
                    <>
                        <PublicVoteDetails
                            votePoolObjectData={votePoolObjectData}
                            voteId={voteId}
                        />

                        {detail && (
                            <VoteCast
                                voteId={voteId}
                                voteBoxId={votePoolObjectData?.votebox_id || ''}
                                decryptedVotePoolData={detail}
                                customCastVoteTx={castVoteTx_woal}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
} 