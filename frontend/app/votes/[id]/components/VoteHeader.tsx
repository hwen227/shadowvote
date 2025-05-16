import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getRemainingTime } from "@/lib/utils";
import { SuiResponseVotePool } from "@/types";
import { VoteStatus } from "@/types";

interface VoteHeaderProps {
    votePoolObjectData: SuiResponseVotePool | null;
    title?: string;
}

export default function VoteHeader({ votePoolObjectData, title = "投票详情" }: VoteHeaderProps) {
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
                return <Badge variant="secondary" className="mr-3">即将开始</Badge>;
            case VoteStatus.ACTIVE:
                return <Badge variant="success" className="mr-3">进行中</Badge>;
            case VoteStatus.ENDED:
                return <Badge variant="destructive" className="mr-3">已结束</Badge>;
        }
    };

    const getStatusText = (status: VoteStatus) => {
        if (!votePoolObjectData) return '';

        switch (status) {
            case VoteStatus.UPCOMING:
                return `开始时间: ${new Date(Number(votePoolObjectData.start)).toLocaleString('zh-CN')}`;
            case VoteStatus.ACTIVE:
                return `剩余时间: ${getRemainingTime(votePoolObjectData.end)}`;
            case VoteStatus.ENDED:
                return `结束于: ${new Date(Number(votePoolObjectData.end)).toLocaleString('zh-CN')}`;
        }
    };

    const status = getVoteStatus();

    return (
        <div className="container max-w-3xl mx-auto px-4 pt-8">
            <div className="flex items-center mb-6">
                <Button
                    variant="outline"
                    size="icon"
                    className="mr-4"
                    asChild
                >
                    <Link href="/votes">
                        <i className="fas fa-arrow-left"></i>
                    </Link>
                </Button>
                <h1 className="text-xl font-medium">{title}</h1>
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
        </div>
    );
} 