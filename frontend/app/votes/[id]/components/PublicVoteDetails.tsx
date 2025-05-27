import { SuiResponseVotePool, EncryptedInputVotePool } from "@/types";
import { formatAddress } from "@/lib/utils";
import { useEffect, useState } from "react";
import { FilePreview } from "@/components/vote/file-preview";
import { Calendar, LinkIcon, User, Users } from "lucide-react";


interface PublicVoteDetailsProps {
    votePoolObjectData: SuiResponseVotePool | null;
    voteId: string;
}

export default function PublicVoteDetails({
    votePoolObjectData,
    voteId
}: PublicVoteDetailsProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [votePoolData, setvotePoolData] = useState<EncryptedInputVotePool | null>(null);

    useEffect(() => {
        if (votePoolObjectData && typeof votePoolObjectData.details === 'string') {
            try {
                const parsedDetails = JSON.parse(votePoolObjectData.details);
                setvotePoolData(parsedDetails);
                setIsLoading(false);
            } catch (error) {
                console.error('loading vote details error:', error);
                setIsLoading(false);
            }
        }
    }, [votePoolObjectData]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg mb-8">
                <div className="mb-4">
                    <div className="w-8 h-8 border-4 border-t-blue-500 border-b-blue-200 border-l-blue-200 border-r-blue-200 rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-600">Loading vote details...</p>
            </div>
        );
    }

    if (!votePoolData) {
        return (
            <div className="flex flex-col items-center justify-center py-8 border border-dashed rounded-lg mb-8">
                <p className="text-gray-600 mb-4">Failed to load vote details</p>
            </div>
        );
    }

    return (
        <>
            <div className="border border-purple-900/50 bg-black/30 backdrop-blur-sm rounded-lg p-6 mb-6">
                <p className="text-gray-300 mb-6">{votePoolData.description}</p>

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

            {votePoolData.attch_file_blobs && votePoolData.attch_file_blobs.length > 0 && (
                <FilePreview files={votePoolData.attch_file_blobs} />
            )}
        </>
    );
}