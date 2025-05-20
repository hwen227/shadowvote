module shadowvote::nft_voting;
use std::string::String;
use std::type_name::{Self, TypeName};
use shadowvote::shadowvote::{Self,State};
use shadowvote::votebox::{Self,EncryptedVoteBox,EncryptedVote};

public struct VotePool has key{
    id: UID,
    details : vector<u8>,
    ntf_token: TypeName,
    title: String,
    creator : address,
    start: u64,
    end: u64,
    votebox_id : ID,
    participantsCount :u64,
}

public fun create_vote_pool<T:key,store>(
    ntf: &T,
    title: String,
    details: vector<u8>,
    start: u64,
    end: u64,
    ctx: &mut TxContext
):VotePool{
    assert!(start < end);

    let votebox_id= votebox::create_votebox(ctx);

    let creator =  tx_context::sender(ctx);
    let votepool = VotePool {
        id: object::new(ctx),
        details,
        allowlist_id: object::id(allowlist),
        title,
        creator,
        start,
        end,
        votebox_id,
        participantsCount: 0
    };

    votepool
}