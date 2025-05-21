import VoteDetailClient from "./components/VoteDetailClient";

export default function VoteDetailPage({
    params,
}: {
    params: { id: string };
}) {
    return <VoteDetailClient voteId={params.id} />;
} 