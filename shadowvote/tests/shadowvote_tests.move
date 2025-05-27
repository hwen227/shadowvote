
#[test_only]
module shadowvote::shadowvote_tests;
use shadowvote::nft_voting::TestNFT;
use shadowvote::nft_voting;
use sui::test_scenario;
use std::debug;
use std::bcs;
use std::type_name::{Self};
use std::ascii;
// uncomment this line to import the module
// use shadowvote::shadowvote;

const ENotImplemented: u64 = 0;

#[test]
fun test_shadowvote() {
    let alice = @0x123;
    let mut scenario_val = test_scenario::begin(alice);
    let scenario = &mut scenario_val;

    test_scenario::next_tx(scenario,alice);
    {
    nft_voting::test_create_nft(test_scenario::ctx(scenario));
    };

    test_scenario::next_tx(scenario,alice);
    //let nft_typename = type_name::get<TestNFT>();
   // let namespace = bcs::to_bytes(&nft_typename.get_address());
     let nft = test_scenario::take_from_sender<TestNFT>(scenario);
   //  let id = nft_voting::get_id(&nft);
   //
   //  debug::print(id);
   //  debug::print(&bcs::to_bytes(&id.to_bytes()));

    test_scenario::return_to_sender(scenario,nft);
     let test_astring = b"eb489bb3ca236a7abab9542e44216f1a3ab82621e49ce1c747c618e3638269ea";
     let test_wrap = ascii::string(test_astring);
     let test_bcs = bcs::to_bytes(&test_wrap);

    // debug::print(&nft_typename);
    // debug::print(&namespace);

    // debug::print(&test_astring);
    // debug::print(&test_wrap);
    debug::print(&test_bcs);

    test_scenario::end(scenario_val);


}

// #[test, expected_failure(abort_code = ::shadowvote::shadowvote_tests::ENotImplemented)]
// fun test_shadowvote_fail() {
//     abort ENotImplemented
// }

