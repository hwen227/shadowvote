import VoteDetailClient from "./components/VoteDetailClient";

export default async function VoteDetailPage({
    params,
}: {
    params: { id: string } | Promise<{ id: string }>;
}) {
    const resolvedParams = await params;
    return <VoteDetailClient voteId={resolvedParams.id} />;
} 