// 投票状态枚举
export enum VoteStatus {
    UPCOMING = "upcoming",
    ACTIVE = "active",
    ENDED = "ended"
}


// 投票类型定义
export type WalrusVotePool = {
    title: string,
    description: string,
    options: VoteOption[],
}

export type VoteOption = {
    id: string,
    text: string,
    voteCount?: number,
}

export type VoteCreateSuccessType = {
    voteId: string,
    digest: string,
}

export type SuiEncryptedVoteType = {
    voter: string,
    vote: Uint8Array,
}

export type SuiVotePool = {
    id: { id: string },
    title: string,
    creator: string,
    blob_id: string,
    allowlist_id: string,
    votebox_id: string,
    start: number,
    end: number,
    participantsCount: number,
}

// 前端显示用的投票池类型

export type VotePoolDisplayType = {
    id: string,
    title: string,
    creator: string,
    blob_id: string,
    allowlist_id: string,
    votebox_id: string,
    start: number,
    end: number,
    participantsCount: number,
    status: VoteStatus,
    iconType: string,
}

export type SuiAllowlist = {
    id: string,
    creator: string,
    blob_id: string,
    allowlist: string[],
}

