"use client";

import VoteResult from "@/app/votes/[id]/components/VoteResult";
import { useState, use, useEffect, useCallback } from "react";
import { EncryptedInputVotePool } from "@/types";
import { useCurrentAccount, useSignPersonalMessage } from "@mysten/dapp-kit";
import { getVotePoolById, queryNftType, VoteType } from "@/contracts/query";
import { SuiResponseVotePool } from "@/types";
import { SessionKey } from "@mysten/seal";
import { networkConfig, suiClient } from "@/contracts";
import VoteDecryptedDetails from "../components/VoteDecryptedDetails";
import PublicVoteDetails from "../components/PublicVoteDetails";
import { Transaction } from "@mysten/sui/transactions";
import { fromHex } from "@mysten/sui/utils";
import { MoveCallConstructor } from "@/contracts/seal";
import VoteHeader from "../components/VoteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    const [voteType, setVoteType] = useState<VoteType>('allowlist');
    const [nftObjectId, setNftObjectId] = useState('');
    const [isNftIdValid, setIsNftIdValid] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    const fetchVoteData = useCallback(async () => {
        try {
            const [suiVotePoolData, voteTypeValue] = await getVotePoolById(voteId);

            console.log('suiVotePoolData', suiVotePoolData);
            console.log('voteTypeValue', voteTypeValue);
            if (!suiVotePoolData) {
                setVoteNotFound(true);
            }
            setVotePoolObjectData(suiVotePoolData);
            setVoteType(voteTypeValue as VoteType);
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
                    },
                    onError: (error) => {
                        console.error('sign failed:', error);

                    }
                }
            );
        } catch (error) {
            console.error('sign failed:', error);
        }
    }, [currentAccount, signPersonalMessage]);

    useEffect(() => {
        fetchVoteData();
        setCurrentSessionKey(null);
    }, [currentAccount, fetchVoteData]);

    useEffect(() => {
        if (voteType === 'public') {
            setDecryptedVotePoolData(JSON.parse(votePoolObjectData?.details as string));
        }
    }, [votePoolObjectData, voteType]);


    const validateNftId = async (id: string) => {
        try {
            const nft_type = await queryNftType(id, currentAccount?.address || '');
            return nft_type.slice(2) == votePoolObjectData?.nft_token?.fields?.name;
        } catch (error) {
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
            console.error("Error validating NFT:", error);
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

    const handleDecryptSuccess = (decryptedData: EncryptedInputVotePool) => {
        setDecryptedVotePoolData(decryptedData);
    };

    // MoveCallConstructor 选择逻辑
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

    const constructMoveCall_result = (voteboxId: string, end: number): MoveCallConstructor => {
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
            return (_tx: Transaction, _id: string) => {
                void _tx; void _id;
                console.error("Invalid parameters for move call constructor or missing votePoolObjectData");
            };
        }
    };

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Animated background with tech pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black z-0 overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9IiM4YjVjZjYiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9wYXR0ZXJuPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')]"></div>
            </div>
            <div className="container mx-auto max-w-4xl px-4 py-8 relative z-10">
                <VoteHeader votePoolObjectData={votePoolObjectData} title="Voting Pools" />

                {/* 需要验证的投票类型 */}
                {(voteType === 'allowlist' || voteType === 'nft') ? (
                    <>



                        {isSessionKeyValid && votePoolObjectData && (
                            <VoteDecryptedDetails
                                votePoolObjectData={votePoolObjectData}
                                voteId={voteId}
                                sessionKey={currentSessionKey}
                                decryptedVotePoolData={decryptedVotePoolData}
                                onDecryptSuccess={handleDecryptSuccess}
                                customMoveCallConstructor={getCustomMoveCallConstructor(voteType, votePoolObjectData, nftObjectId)}
                            />
                        )}

                        {isSessionKeyValid && votePoolObjectData && decryptedVotePoolData && (
                            <VoteResult
                                votePool={votePoolObjectData}
                                options={decryptedVotePoolData.options}
                                sessionKey={currentSessionKey}
                                customMoveCall={constructMoveCall_result(votePoolObjectData.votebox_id, votePoolObjectData.end)}
                            />
                        )}


                    </>
                ) : (
                    // 公开投票
                    <>
                        <PublicVoteDetails
                            votePoolObjectData={votePoolObjectData}
                            voteId={voteId}
                        />
                        {isSessionKeyValid && votePoolObjectData && decryptedVotePoolData && (
                            <VoteResult
                                votePool={votePoolObjectData}
                                options={decryptedVotePoolData.options}
                                sessionKey={currentSessionKey}
                                customMoveCall={constructMoveCall_result(votePoolObjectData.votebox_id, votePoolObjectData.end)}
                            />
                        )}
                    </>
                )}

                {!isSessionKeyValid && (
                    <div className="flex flex-col items-center justify-center py-8 border border-purple-900/50 bg-black/30 backdrop-blur-sm rounded-lg mb-8">
                        {!voteType.includes('nft') && (
                            <>
                                <p className="text-gray-400 mb-4">This vote requires identity verification, please sign to view vote result</p>
                                <Button
                                    onClick={signSessionKey}
                                    className="bg-purple-500 hover:bg-purple-600 mb-8">
                                    Sign
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
            </div>
        </div>
    );
} 