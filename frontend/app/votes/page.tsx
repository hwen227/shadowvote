"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VoteCard } from "@/components/vote/vote-card";
import { VoteStatus, VotePoolDisplayType, SuiVotePool } from "@/types";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { getVotePoolById } from "@/contracts/query";


const mockVotesIds = [
    "0x794f04adfa5a9bf93f309e80683574c87bd7bd6f027ddb81d48a1524f76c359f",
]


export default function VotesPage() {
    const [activeTab, setActiveTab] = useState<"all" | "active" | "upcoming" | "ended">("all");
    const [votepools, setVotepools] = useState<VotePoolDisplayType[]>([]);
    const currentAccount = useCurrentAccount();


    useEffect(() => {
        const fetchVotes = async () => {
            const votepools = await getVotePoolById(mockVotesIds[0]);// for test
            const displayVotepools = convertVotePoolToDisplayType(votepools); //for tes ,go map when really use

            console.log(displayVotepools);
            setVotepools([displayVotepools]);
        }
        fetchVotes();
    }, [currentAccount]);

    // 根据选项卡筛选投票
    const getFilteredVotes = () => {
        switch (activeTab) {
            case "active":
                return votepools.filter(vote => vote.status === VoteStatus.ACTIVE);
            case "upcoming":
                return votepools.filter(vote => vote.status === VoteStatus.UPCOMING);
            case "ended":
                return votepools.filter(vote => vote.status === VoteStatus.ENDED);
            default:
                return votepools;
        }
    };

    const convertVotePoolToDisplayType = (votePool: SuiVotePool): VotePoolDisplayType => {

        const currentTime = Date.now();
        let status = VoteStatus.ENDED;

        if (currentTime >= votePool.end) {
            status = VoteStatus.ENDED;
        } else if (currentTime >= votePool.start) {
            status = VoteStatus.ACTIVE;
        } else {
            status = VoteStatus.UPCOMING;
        }

        return {
            id: votePool.id.id,
            title: votePool.title,
            creator: votePool.creator,
            blob_id: votePool.blob_id,
            allowlist_id: votePool.allowlist_id,
            votebox_id: votePool.votebox_id,
            start: votePool.start,
            end: votePool.end,
            participantsCount: votePool.participantsCount,
            status,
            iconType: "chart-pie"
        } as VotePoolDisplayType;
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-xl font-medium">可参与的投票</h1>
            </div>

            <Tabs defaultValue="all" onValueChange={(value) => setActiveTab(value as never)}>
                <TabsList className="mb-6">
                    <TabsTrigger value="all">全部</TabsTrigger>
                    <TabsTrigger value="active">进行中</TabsTrigger>
                    <TabsTrigger value="upcoming">即将开始</TabsTrigger>
                    <TabsTrigger value="ended">已结束</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {getFilteredVotes().map(votepools => (
                            <VoteCard key={votepools.id} vote={votepools} />
                        ))}

                        {/* 创建新投票卡片 */}
                        <Link href="/votes/create" passHref>
                            <div className="bg-white rounded-lg border border-gray-200 border-dashed p-6 flex flex-col items-center justify-center h-full cursor-pointer hover:bg-gray-50 transition-colors">
                                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                                    <i className="fas fa-plus text-primary text-lg"></i>
                                </div>
                                <h3 className="font-medium text-primary text-base mb-2">创建新投票</h3>
                                <p className="text-sm text-gray-500 text-center">
                                    发起一个新的匿名投票
                                </p>
                            </div>
                        </Link>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
} 