"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useCurrentAccount, useSignPersonalMessage } from "@mysten/dapp-kit";
import { getVotePoolById, queryNftType, VoteType } from "@/contracts/query";
import { SuiResponseVotePool, EncryptedInputVotePool } from "@/types";
import { SessionKey } from "@mysten/seal";
import { networkConfig, suiClient } from "@/contracts";
import VoteDecryptedDetails from "./VoteDecryptedDetails";
import PublicVoteDetails from "./PublicVoteDetails";
import VoteCast from "./VoteCast";
import VoteHeader from "./VoteHeader";
import { castVoteTx, castVoteTx_woal, castVoteTx_with_nft } from "@/contracts/transaction";
import { Button } from "@/components/ui/button";
import { MoveCallConstructor } from "@/contracts/seal";
import { Transaction } from "@mysten/sui/transactions";
import { fromHex } from "@mysten/sui/utils";
import { Input } from "@/components/ui/input";

type VoteDetailClientProps = {
    voteId: string
}

export default function VoteDetailClient({ voteId }: VoteDetailClientProps) {
    const [votePoolObjectData, setVotePoolObjectData] = useState<SuiResponseVotePool | null>(null);
    const [decryptedVotePoolData, setDecryptedVotePoolData] = useState<EncryptedInputVotePool | null>(null);
    const [voteNotFound, setVoteNotFound] = useState(false);
    const [currentSessionKey, setCurrentSessionKey] = useState<SessionKey | null>(null);
    const [isSigningMessage, setIsSigningMessage] = useState(false);
    const [detail, setDetail] = useState<EncryptedInputVotePool | null>(null)
    const [voteType, setVoteType] = useState<VoteType>('allowlist');
    const [nftObjectId, setNftObjectId] = useState<string>('');
    const [isNftIdValid, setIsNftIdValid] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

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
            const [suiVotePoolData, voteTypeValue] = await getVotePoolById(voteId);

            if (!suiVotePoolData) {
                setVoteNotFound(true);
            }
            setVotePoolObjectData(suiVotePoolData);
            setVoteType(voteTypeValue as VoteType);
        } catch (error) {
            console.error("fetch vote data error:", error);
            setVoteNotFound(true);
        }
    }, [voteId]);

    useEffect(() => {
        const init = async () => {
            await fetchVoteData();
            setCurrentSessionKey(null);
            setDecryptedVotePoolData(null);
        };

        init();
    }, [currentAccount, fetchVoteData]);

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
                ttlMin: 10,
                suiClient: suiClient
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
                        console.error('sign message error:', error);
                        setIsSigningMessage(false);
                    }
                }
            );
        } catch (error) {
            console.error('sign message error:', error);
            setIsSigningMessage(false);
        }
    }, [currentAccount, signPersonalMessage]);



    // 添加新的 useEffect 来处理 details 的解析
    useEffect(() => {
        if (voteType === 'public' && votePoolObjectData && typeof votePoolObjectData.details === 'string') {
            try {
                const parsedDetails = JSON.parse(votePoolObjectData.details);
                setDetail(parsedDetails);
            } catch (error) {
                console.error('process details error:', error);
            }
        }
    }, [voteType, votePoolObjectData]);


    const constructMoveCall = (allowlistId: string): MoveCallConstructor => {
        return (tx: Transaction, id: string) => {
            tx.moveCall({
                target: `${networkConfig.testnet.variables.packageID}::allowlist::seal_approve`,
                arguments: [
                    tx.pure.vector('u8', fromHex(id)),
                    tx.object(allowlistId),
                ]
            });
        };
    };

    const constructMoveCall_nft = (nft_id: string, vote_pool_id: string, nft_type: string): MoveCallConstructor => {
        return (tx: Transaction, id: string) => {
            tx.moveCall({
                target: `${networkConfig.testnet.variables.packageID}::nft_voting::seal_approve`,
                typeArguments: [nft_type],
                arguments: [
                    tx.pure.vector('u8', fromHex(id)),
                    tx.object(nft_id),
                    tx.object(vote_pool_id)
                ]
            });
        };
    };

    const getCustomMoveCallConstructor = (type: VoteType, data: SuiResponseVotePool | null, nftId?: string): MoveCallConstructor => {
        if (type === 'allowlist' && data?.allowlist_id) {
            return constructMoveCall(data.allowlist_id);
        } else if (type === 'nft' && data?.nft_token?.fields && data?.id?.id && nftId) {
            return constructMoveCall_nft(
                nftId,
                data.id.id,
                data.nft_token.fields.name || ''
            );
        } else {
            throw new Error("Invalid parameters for move call constructor or missing votePoolObjectData");
        }
    };


    const validateNftId = async (id: string) => {
        try {
            const nft_type = await queryNftType(id, currentAccount?.address || '');
            return nft_type.slice(2) == votePoolObjectData?.nft_token?.fields?.name;
        } catch (error) {
            console.error("NFT validation error:", error);
            if (error instanceof Error) {
                setValidationError(error.message);
            } else {
                setValidationError("");
            }
            return false;
        }
    };


    const handleNftIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNftObjectId(value);
        // 清除之前的验证状态
        setIsNftIdValid(false);
        setValidationError(null);
    };

    const handleValidateNft = async () => {
        if (!nftObjectId) {
            setValidationError("please input nft object id");
            return;
        }
        setIsValidating(true);
        setValidationError(null);
        try {
            const isValid = await validateNftId(nftObjectId);
            setIsNftIdValid(isValid);
            if (!isValid) {
                setValidationError("Invalid NFT Object");
            } else {
                signSessionKey();
            }
        } catch (error) {
            console.error("Validation error:", error);
            setIsNftIdValid(false);
        } finally {
            setIsValidating(false);
        }
    };

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

    // 检查是否需要验证的投票类型
    const needsVerification = voteType === 'allowlist' || voteType === 'nft';

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Animated background with tech pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black z-0 overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9IiM4YjVjZjYiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9wYXR0ZXJuPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')]"></div>
            </div>
            <div className="container mx-auto max-w-4xl px-4 py-8 relative z-10">
                <VoteHeader votePoolObjectData={votePoolObjectData} />

                {/* 根据投票类型决定显示哪种组件 */}
                {needsVerification ? (
                    // 需要验证的投票
                    <>
                        {/* 如果没有有效的会话密钥，显示签名按钮 */}
                        {!isSessionKeyValid && (
                            <div className="flex flex-col items-center justify-center py-8 border border-purple-900/50 bg-black/30 backdrop-blur-sm rounded-lg mb-8">
                                {!voteType.includes('nft') && (
                                    <>
                                        <p className="text-gray-400 mb-4">This vote requires identity verification, please sign to view vote details</p>
                                        <Button
                                            onClick={signSessionKey}
                                            className="bg-purple-500 hover:bg-purple-600 mb-8">
                                            {isSigningMessage ? 'Signing...' : 'Sign'}
                                        </Button>
                                    </>
                                )}

                                {voteType === 'nft' && (
                                    <>
                                        <p className="text-gray-400 mb-6">This vote requires NFT verification, please verify your NFT ownership to participate</p>
                                        <div className="w-full max-w-2xl px-4">
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="text"
                                                    placeholder="Please input your NFT Object ID (0x...)"
                                                    value={nftObjectId}
                                                    onChange={handleNftIdChange}
                                                    className="flex-1 bg-black/50 border-purple-900/50 text-white focus:ring-purple-500 focus:border-purple-500"
                                                />
                                                <Button
                                                    onClick={handleValidateNft}
                                                    disabled={isValidating || !nftObjectId || isNftIdValid}
                                                    className={`min-w-[100px] ${isNftIdValid
                                                        ? 'bg-green-600 hover:bg-green-700'
                                                        : 'bg-purple-500 hover:bg-purple-600'
                                                        }`}
                                                >
                                                    {isValidating ? (
                                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    ) : isNftIdValid ? (
                                                        'Verified'
                                                    ) : (
                                                        'Verify'
                                                    )}
                                                </Button>
                                            </div>
                                            {validationError && (
                                                <p className="text-red-500 text-sm mt-2 text-center">{validationError}</p>
                                            )}
                                            {isNftIdValid && (
                                                <p className="text-gray-400 text-sm mt-2 text-center">NFT verified successfully, please sign to view vote details</p>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {isSessionKeyValid && votePoolObjectData && (
                            <>


                                {(voteType === 'allowlist' || (voteType === 'nft' && isNftIdValid)) && (
                                    <VoteDecryptedDetails
                                        votePoolObjectData={votePoolObjectData}
                                        voteId={voteId}
                                        sessionKey={currentSessionKey}
                                        decryptedVotePoolData={decryptedVotePoolData}
                                        onDecryptSuccess={handleDecryptSuccess}
                                        customMoveCallConstructor={getCustomMoveCallConstructor(voteType, votePoolObjectData, nftObjectId)}
                                    />
                                )}



                                {/* 投票选择部分，只在已解密时显示 */}
                                {decryptedVotePoolData && (
                                    <VoteCast
                                        voteId={voteId}
                                        voteBoxId={votePoolObjectData?.votebox_id || ''}
                                        decryptedVotePoolData={decryptedVotePoolData}
                                        customCastVoteTx={voteType === 'nft' ? castVoteTx_with_nft : castVoteTx}
                                    />
                                )}
                            </>
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