"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VotePoolDisplayType, VoteStatus } from "@/types";
import { ExternalLink, PieChart, Users } from "lucide-react";

// 投票卡片属性
interface VoteCardProps {
    vote: VotePoolDisplayType;
}

export function VoteCard({ vote }: VoteCardProps) {
    // 根据状态获取徽章样式
    const getBadgeVariant = (status: VoteStatus) => {
        switch (status) {
            case VoteStatus.ACTIVE:
                return "success";
            case VoteStatus.UPCOMING:
                return "warning";
            case VoteStatus.ENDED:
                return "destructive";
            default:
                return "outline";
        }
    };

    // 根据状态获取状态文本
    const getStatusText = (status: VoteStatus) => {
        switch (status) {
            case VoteStatus.ACTIVE:
                return "Active";
            case VoteStatus.UPCOMING:
                return "Upcoming";
            case VoteStatus.ENDED:
                return "Ended";
            default:
                return "Unknown Status";
        }
    };

    // 根据状态获取按钮文本和样式
    const getButtonProps = (status: VoteStatus) => {
        switch (status) {
            case VoteStatus.ACTIVE:
                return {
                    text: "Vote",
                    icon: "vote-yea",
                    variant: "default" as const
                };
            case VoteStatus.UPCOMING:
                return {
                    text: "View Details",
                    icon: "clock",
                    variant: "outline" as const
                };
            case VoteStatus.ENDED:
                return {
                    text: "View Results",
                    icon: "chart-bar",
                    variant: "outline" as const
                };
            default:
                return {
                    text: "查看详情",
                    icon: "info-circle",
                    variant: "outline" as const
                };
        }
    };



    const buttonProps = getButtonProps(vote.status);
    const badgeVariant = getBadgeVariant(vote.status);
    const statusText = getStatusText(vote.status);

    // 构建链接地址
    const getLinkHref = () => {
        if (vote.status === VoteStatus.ENDED) {
            return `/votes/${vote.id}/result`;
        }
        return `/votes/${vote.id}`;
    };

    return (
        <div className="border border-purple-900/50 bg-black/30 backdrop-blur-sm rounded-lg p-6 relative h-[260px] flex flex-col">
            <div className="absolute top-4 right-4">
                <Badge variant={badgeVariant} className="px-3 py-1.5 rounded-full border border-red-900/50">{statusText}</Badge>
            </div>

            <div className="text-center flex-grow">
                <div className="flex justify-center mb-4">
                    <div className="bg-purple-900/30 p-3 rounded-full">
                        <PieChart className="w-6 h-6 text-purple-400" />
                    </div>
                </div>
                <h3 className="font-medium text-base mb-1 line-clamp-2">{vote.title}</h3>

                <div className="flex items-center justify-center text-sm text-gray-400">
                    <Users className="w-4 h-4 mr-1" />
                    <span>{vote.participantsCount} participants</span>
                </div>
            </div>

            <div className="mt-auto pt-4">
                <Link href={getLinkHref()} passHref>
                    <Button
                        variant="outline"
                        className="w-full bg-black/50 border-purple-900/50 hover:bg-purple-900/20 hover:border-purple-500 text-gray-300 hover:text-purple-400 transition-colors"
                    >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {buttonProps.text}
                    </Button>
                </Link>
            </div>
        </div>
    );
} 