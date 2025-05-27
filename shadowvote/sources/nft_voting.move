module shadowvote::nft_voting;
use std::string::String;
use std::type_name::{Self, TypeName};
use std::bcs;
use sui::event;
use shadowvote::shadowvote::{Self,State};
use shadowvote::votebox::{Self,EncryptedVoteBox};
use sui::clock::{Self,Clock};
use shadowvote::utils::is_prefix;

public struct VotePool has key{
    id: UID,
    details : vector<u8>,
    nft_token: TypeName,
    title: String,
    creator : address,
    start: u64,
    end: u64,
    votebox_id : ID,
    participantsCount :u64,
}

#[test_only]
public struct TestNFT has key,store{
    id : UID
}

public struct VotePoolCreated has copy,drop{
    creator : address,
    vote_pool: ID
}

const EInvalidVote: u64 = 2;
const EVoteNotStart: u64 = 3;
const EAlreadyFinalized: u64 = 4;
const EDuplicateVote:u64 =5 ;


#[test_only]
public fun test_create_nft(ctx: &mut TxContext){
    let nft = TestNFT{
        id : object::new(ctx)
    };

    transfer::public_transfer(nft,ctx.sender());
}

#[test_only]
public fun get_id(nft: &TestNFT): &UID{
    &nft.id
}

public fun create_vote_pool_entry<T:key+store>(
    state : &mut State,
    details: vector<u8>,
    nft: &T,
    title: String,
    start: u64,
    end: u64,
    ctx: &mut TxContext)
{
    let votepool = create_vote_pool<T>(
        nft,
        title,
        details,
        start,
        end,
        ctx
    );

    let sender = tx_context::sender(ctx);
    let pool_id = object::id(&votepool);

    if(shadowvote::if_contains_sender(state,sender)){
        shadowvote::add_vote_pool(state,sender,pool_id);
    }else {
        shadowvote::add_new_user_vote_pool(state,sender,pool_id);
    };

    let create_vote_event = VotePoolCreated{
        creator: sender,
        vote_pool: pool_id
    };

    event::emit(create_vote_event);
    transfer::share_object(votepool);
}

public fun create_vote_pool<T:key+store>(
    _ntf: &T,
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
        nft_token : type_name::get<T>(),
        title,
        creator,
        start,
        end,
        votebox_id,
        participantsCount: 0
    };

    votepool
}

public fun cast_vote(
    vote_pool: &mut VotePool,
    votebox : &mut EncryptedVoteBox,
    vote: vector<u8>,
    clock : &Clock,
    ctx: &TxContext,
){

    let voter = tx_context::sender(ctx);
    assert!(clock::timestamp_ms(clock)<=vote_pool.end,EAlreadyFinalized);
    assert!(clock::timestamp_ms(clock)>=vote_pool.start,EVoteNotStart);
    assert!(vote_pool.votebox_id==object::id(votebox),EInvalidVote);
    assert!(!votebox::has_voted(votebox,voter),EDuplicateVote);

    let encrypt_vote = votebox::create_encrypted_vote(voter,vote);

    votebox::add_vote(votebox,encrypt_vote);
    let count = vote_pool.participantsCount;
    vote_pool.participantsCount = count+ 1;
}

entry fun seal_approve<T : key+store>(id: vector<u8>,nft_token: &T,votepool : &VotePool){
    assert!(approve_internal(id,nft_token,votepool));
}

fun approve_internal<T : key+store>(id: vector<u8>,_nft_token: &T,votepool : &VotePool): bool {

    let nft_typename = type_name::get<T>();
    let namespace = bcs::to_bytes(&nft_typename.get_address());
    if (!is_prefix(namespace, id)) {
        return false
    };
    if(nft_typename == votepool.nft_token){
        return true
    };
    false
}