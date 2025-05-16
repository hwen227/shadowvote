"use client";

//TODO： 区分状态，未开启的投票和以开启的投票

import { use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function VoteSubmitPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const voteId = params instanceof Promise
        ? use(params).id
        : params.id;

    const handleBackToList = () => {
        router.push("/votes");
    };

    const handleBackToDetail = () => {
        router.push(`/votes/${voteId}`);
    };

    return (
        <div className="container max-w-2xl mx-auto px-4 py-8">
            <div className="flex items-center mb-6">
                <Button
                    variant="outline"
                    size="icon"
                    className="mr-4"
                    onClick={handleBackToDetail}
                >
                    <i className="fas fa-arrow-left"></i>
                </Button>
                <h1 className="text-xl font-medium">投票提交成功</h1>
            </div>

            <Card className="bg-green-50 mb-6">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <i className="fas fa-check text-2xl text-green-500"></i>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">您的投票已成功提交</h3>
                        <p className="text-gray-600 mb-4">感谢您参与社区治理</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-gray-50 mb-8">
                <CardContent className="pt-6">
                    <div className="flex items-center text-sm text-gray-500">
                        <i className="fas fa-shield-alt text-primary mr-2"></i>
                        <span>您的投票已被加密存储，在投票结束前无人可见</span>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-center gap-4">
                <Button
                    variant="outline"
                    onClick={handleBackToDetail}
                    className="w-full md:w-auto"
                >
                    返回投票详情
                </Button>
                <Button
                    onClick={handleBackToList}
                    className="w-full md:w-auto"
                >
                    查看所有投票
                </Button>
            </div>
        </div>
    );
} 