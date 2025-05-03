/// Module: shadowvote
module shadowvote::shadowvote;
use std::string::{String};
use std::vector;

use sui::clock::{Self,Clock};
use sui::event;
use sui::table;
use sui::table::Table;
use shadowvote::utils::is_prefix;

const EInvalidVotePool :u64 = 0;
const EUnauthorizedAccess : u64 = 1;
const EInvalidVote: u64 = 2;
//const EVoteNotDone: u64 = 3;
const EVoteNotStart: u64 = 3;
const EAlreadyFinalized: u64 = 4;
const EDuplicateVote:u64 =5 ;

public struct State has key{
    id: UID,
    creator_votepool : Table<address,vector<ID>>
}
public struct StateCap has key{
    id :UID,
    state_id : ID
}
public struct VotePool has key{
    id: UID,
    blob_id : String,
    allowlist_id: ID,
    title: String,
    creator : address,
    start: u64,
    end: u64,
    votebox_id : ID,
    participantsCount :u64,
}

public struct EncryptedVoteBox has key{
    id: UID,
    votes : vector<EncryptedVote>
}

public struct EncryptedVote has store, copy, drop{
    voter : address,
    vote : vector<u8>
}


public struct VotePoolCreated has copy,drop{
    creator : address,
    vote_pool: ID
}

fun init(ctx: &mut TxContext){

    let uid = object::new(ctx);
    let state_id = object::uid_to_inner(&uid);

    let state = State{
        id: uid,
        creator_votepool : table::new<address,vector<ID>>(ctx)
    };

    let cap = StateCap{
        id : object::new(ctx),
        state_id
    };

    transfer::share_object(state);
    transfer::transfer(cap,tx_context::sender(ctx));
}

public fun create_vote_pool_entry(
    state : &mut State,
    blob_id: String,
    allowlist: ID,
    title: String,
    start: u64,
    end: u64,
    ctx: &mut TxContext)
{
    let votepool = create_vote_pool(
        blob_id,
        allowlist,
        title,
        start,
        end,
        ctx
    );
    let sender = tx_context::sender(ctx);
    let pool_id = object::id(&votepool);

   if(table::contains(&state.creator_votepool,sender)){
       let pools = table::borrow_mut<address,vector<ID>>(&mut state.creator_votepool, sender);
       vector::push_back(pools,pool_id);
   }else {
       let pools = vector::singleton(pool_id);
       table::add(&mut state.creator_votepool, sender, pools);
   };

    let create_vote_event = VotePoolCreated{
        creator: sender,
        vote_pool: pool_id
    };

    event::emit(create_vote_event);
    transfer::share_object(votepool);
}

public fun create_vote_pool(
    blob_id: String,
    allowlist_id: ID,
    title: String,
    start: u64,
    end: u64,
    ctx: &mut TxContext
):VotePool{
    assert!(start < end);

    let votes_uid = object::new(ctx);
    let votebox_id = object::uid_to_inner(&votes_uid);
    let creator =  tx_context::sender(ctx);
    let votepool = VotePool {
        id: object::new(ctx),
        blob_id,
        allowlist_id,
        title,
        creator,
        start,
        end,
        votebox_id,
        participantsCount: 0
    };

    let votebox = EncryptedVoteBox {
        id : votes_uid,
        votes : vector::empty()
    };
    transfer::share_object(votebox);
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
    assert!(!has_voted(votebox,voter),EDuplicateVote);
    let vote = EncryptedVote{
        voter,
        vote
    };
    vector::push_back<EncryptedVote>(&mut votebox.votes,vote);
    let count = vote_pool.participantsCount;
    vote_pool.participantsCount = count+ 1;
}

entry fun seal_approve(id: vector<u8>, vote_pool : &VotePool,clock :&Clock,ctx: &TxContext) {
    assert!(approve_internal(tx_context::sender(ctx),id,vote_pool,clock),EUnauthorizedAccess);
}


//==============================================================================================
// Helper Functions
//==============================================================================================
fun namespace(votepool: &VotePool): vector<u8> {
    votepool.id.to_bytes()

}

//only the creator can see the result before vote end
fun approve_internal(caller: address, id: vector<u8>, votepool: &VotePool,clock : &Clock): bool {

    let namespace = namespace(votepool);
    if (!is_prefix(namespace, id)) {
        return false
    };
    if(clock::timestamp_ms(clock)>= votepool.end||caller==votepool.creator){
        return true
    };
    false
}

public(package) fun get_allow_list(votepool :&VotePool):ID{
    votepool.allowlist_id
}

public(package) fun get_vote_creator(vote_pool: &VotePool):address{
    vote_pool.creator
}

fun has_voted(votebox: &EncryptedVoteBox, voter: address): bool {
    let mut i = 0;
    let len = vector::length(&votebox.votes);

    while (i < len) {
        let vote = vector::borrow(&votebox.votes, i);
        if (vote.voter == voter) {
            return true
        };
        i = i + 1;
    };

    false
}


