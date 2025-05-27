import { SessionKey } from "@mysten/seal";
import { SuiResponseVotePool, EncryptedInputVotePool } from "@/types";
import { decryptVotePool, MoveCallConstructor } from "@/contracts/seal";
import { useUploadBlob } from "@/hooks/useUploadBlob";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { FilePreview } from "@/components/vote/file-preview";
import { Button } from "@/components/ui/button";
import { formatAddress } from "@/lib/utils";
import { Calendar, LinkIcon, User, Users } from "lucide-react";

type VoteDecryptedDetailsProps = {
    votePoolObjectData: SuiResponseVotePool | null;
    voteId: string;
    sessionKey: SessionKey | null;
    decryptedVotePoolData: EncryptedInputVotePool | null;
    onDecryptSuccess: (data: EncryptedInputVotePool) => void;
    customMoveCallConstructor: MoveCallConstructor;
};

export default function VoteDecryptedDetails({
    votePoolObjectData,
    voteId,
    sessionKey,
    decryptedVotePoolData,
    onDecryptSuccess,
    customMoveCallConstructor
}: VoteDecryptedDetailsProps) {
    const { downloadBlob } = useUploadBlob();
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const isDecrypting = useRef(false);

    const handleDecryptVoteData = useCallback(async () => {
        if (isDecrypting.current) {
            console.log("已有解密任务在执行中，跳过");
            return;
        }

        if (!votePoolObjectData || !sessionKey) {
            console.error('Vote pool object data is null or no session key');
            setIsLoading(false);
            setHasError(true);
            return;
        }

        setIsLoading(true);
        setHasError(false);
        isDecrypting.current = true;

        console.log("正在执行中");
        try {
            if (!votePoolObjectData.allowlist_id && !votePoolObjectData.nft_token) {
                throw new Error("无效的投票权限配置");
            }

            const downloadBytes = await votePoolObjectData.details as Uint8Array;

            const decryptedData = await decryptVotePool(sessionKey, downloadBytes, customMoveCallConstructor);

            if (!decryptedData) {
                throw new Error("解密数据为空，您可能没有权限查看此投票");
            }

            onDecryptSuccess(decryptedData);
            setIsLoading(false);
        } catch (error) {
            console.error('解密失败:', error);
            setHasError(true);
            setIsLoading(false);
        } finally {
            isDecrypting.current = false;
        }
    }, [downloadBlob, onDecryptSuccess, sessionKey, voteId, votePoolObjectData, customMoveCallConstructor]);

    useEffect(() => {
        if (
            sessionKey &&
            votePoolObjectData &&
            !decryptedVotePoolData &&
            !isDecrypting.current &&
            !hasError
        ) {
            console.log("开始解密流程");
            handleDecryptVoteData();
        } else if (!sessionKey || !votePoolObjectData) {
            setIsLoading(false);
        }
    }, [sessionKey, votePoolObjectData, decryptedVotePoolData, handleDecryptVoteData, hasError]);

    if (isLoading && !decryptedVotePoolData) {
        return (
            <div className="flex flex-col items-center justify-center py-12 border-purple-900 border-dashed rounded-lg mb-8">
                <div className="mb-4">
                    <div className="w-8 h-8 border-4 border-t-purple-500 border-b-pureple-200 border-l-purple-200 border-r-purple-200 rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-600">getting access...</p>
            </div>
        );
    }

    if (!decryptedVotePoolData && hasError) {
        return (
            <div className="flex flex-col items-center justify-center py-8 border border-dashed rounded-lg mb-8">
                <p className="text-gray-600 mb-4">decryption failed, you may not have permission to view this vote</p>
                <Button
                    onClick={handleDecryptVoteData}
                    disabled={isLoading || isDecrypting.current}
                >
                    {isLoading ? 'Processing' : 'Try again'}
                </Button>
            </div>
        );
    }

    if (!decryptedVotePoolData) {
        return (
            <div className="flex flex-col items-center justify-center py-8 border border-dashed rounded-lg mb-8">
                <p className="text-gray-600 mb-4">decryption in progress...</p>
            </div>
        );
    }

    return (
        <>
            <div className="border border-purple-900/50 bg-black/30 backdrop-blur-sm rounded-lg p-6 mb-6">
                <p className="text-gray-300 mb-6">{decryptedVotePoolData.description}</p>

                <div className="text-sm space-y-3 mb-6">
                    <div className="flex items-center text-gray-400">
                        <User className="w-4 h-4 mr-2 text-purple-400" />
                        <span className="mr-1">Creator:</span>
                        <span className="font-mono">{formatAddress(votePoolObjectData?.creator || '')}</span>
                    </div>

                    <div className="flex items-center text-gray-400">
                        <Users className="w-4 h-4 mr-2 text-purple-400" />
                        <span className="mr-1">Participants:</span>
                        <span className="font-mono">{votePoolObjectData?.participantsCount || 0}</span>
                    </div>

                    <div className="flex items-center text-gray-400">
                        <Calendar className="w-4 h-4 mr-2 text-purple-400" />
                        <span className="mr-1">Start Time:</span>
                        <span className="font-mono">{new Date(Number(votePoolObjectData?.start || 0)).toLocaleString('zh-CN')}</span>
                    </div>
                    <div className="flex items-center text-gray-400">
                        <Calendar className="w-4 h-4 mr-2 text-purple-400" />
                        <span className="mr-1">End Time:</span>
                        <span className="font-mono">{new Date(Number(votePoolObjectData?.end || 0)).toLocaleString('zh-CN')}</span>
                    </div>

                    <div className="flex items-center text-gray-400">
                        <LinkIcon className="w-4 h-4 mr-2 text-purple-400" />
                        <span className="mr-1">Object ID:</span>
                        <span className="font-mono">{voteId}</span>
                    </div>
                </div>
            </div>

            {decryptedVotePoolData.attch_file_blobs && decryptedVotePoolData.attch_file_blobs.length > 0 && (
                <FilePreview files={decryptedVotePoolData.attch_file_blobs} />
            )}
        </>
    );
} 