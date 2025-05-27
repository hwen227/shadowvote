
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getRemainingTime } from "@/lib/utils";
import { SuiResponseVotePool } from "@/types";
import { VoteStatus } from "@/types";
import { ArrowLeft } from "lucide-react";

interface VoteHeaderProps {
    votePoolObjectData: SuiResponseVotePool | null;
    title?: string;
}

export default function VoteHeader({ votePoolObjectData, title = "Voteing Pools" }: VoteHeaderProps) {
    const getVoteStatus = () => {
        if (!votePoolObjectData) return VoteStatus.UPCOMING;

        const now = Date.now();
        const start = votePoolObjectData.start;
        const end = votePoolObjectData.end;

        if (now < start) {
            return VoteStatus.UPCOMING;
        } else if (now >= start && now <= end) {
            return VoteStatus.ACTIVE;
        } else {
            return VoteStatus.ENDED;
        }
    };

    const getStatusBadge = (status: VoteStatus) => {
        switch (status) {
            case VoteStatus.UPCOMING:
                return <Badge variant="secondary" className="mr-3">Upcoming</Badge>;
            case VoteStatus.ACTIVE:
                return <Badge variant="success" className="mr-3">Active</Badge>;
            case VoteStatus.ENDED:
                return <Badge variant="destructive" className="mr-3">Ended</Badge>;
        }
    };

    const getStatusText = (status: VoteStatus) => {
        if (!votePoolObjectData) return '';

        switch (status) {
            case VoteStatus.UPCOMING:
                return `Start Time: ${new Date(Number(votePoolObjectData.start)).toLocaleString('zh-CN')}`;
            case VoteStatus.ACTIVE:
                return `Remaining Time: ${getRemainingTime(votePoolObjectData.end)}`;
            case VoteStatus.ENDED:
                return `End Time: ${new Date(Number(votePoolObjectData.end)).toLocaleString('zh-CN')}`;
        }
    };

    const status = getVoteStatus();

    return (
        <>
            <div className="mb-6">

                <Link href="/votes" className="flex items-center text-gray-400 hover:text-purple-400 transition-colors">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    <span className="text-xl font-medium">{title}</span>
                </Link>

            </div>

            <div className="mb-4">
                <h2 className="text-xl font-semibold mb-2">{votePoolObjectData?.title}</h2>
                <div className="flex items-center">
                    {getStatusBadge(status)}
                    <span className="text-sm text-gray-500">
                        <i className="fas fa-clock mr-1"></i> {getStatusText(status)}
                    </span>
                </div>
            </div>
        </>
    );
} 