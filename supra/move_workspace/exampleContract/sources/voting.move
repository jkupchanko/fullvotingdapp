module owner::voting {
    use std::signer;
    use std::string::String;
    use std::vector;
    use std::table;
    use 0x1::event;

    const E_ALREADY_INITIALIZED: u64 = 1;
    const E_NOT_OWNER: u64 = 2;
    const E_PROPOSAL_NOT_FOUND: u64 = 3;
    const E_ALREADY_VOTED: u64 = 4;
    const E_PROPOSAL_CLOSED: u64 = 5;
    const E_STORE_NOT_INITIALIZED: u64 = 6;
    const E_INVALID_PROPOSAL: u64 = 7;

    #[event]
    struct ProposalCreatedEvent has drop, store {
        id: u64,
        question: String,
        options: vector<String>,
    }

    #[event]
    struct VotedEvent has drop, store {
        proposal_id: u64,
        voter: address,
        choices: vector<u8>,
    }

    #[event]
    struct ProposalClosedEvent has drop, store {
        id: u64,
    }

    #[event]
    struct StoreInitializedEvent has drop, store {
        owner: address,
    }

    #[view]
    public fun has_store(addr: address): bool {
        exists<VotingStore>(addr)
    }

    #[view]
    public fun get_proposal_count(owner: address): u64 acquires VotingStore {
        let store = borrow_global<VotingStore>(owner);
        store.proposal_counter
    }

    struct Proposal has key, store {
        id: u64,
        creator: address,
        question: String,
        options: vector<String>,
        votes: vector<u64>,                  
        open: bool,
        voters: table::Table<address, bool>, 
    }

    struct VotingStore has key {
        proposals: table::Table<u64, Proposal>,
        proposal_counter: u64,
        owner: address,
    }

    public entry fun init(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        assert!(
            !exists<VotingStore>(admin_addr),
            E_ALREADY_INITIALIZED
        );
        move_to(admin, VotingStore {
            proposals: table::new<u64, Proposal>(),
            proposal_counter: 0,
            owner: admin_addr,
        });

        event::emit(StoreInitializedEvent {
            owner: admin_addr,
        });
    }

    #[test(admin = @0x1)]
    public fun test_init(admin: &signer) {
        init(admin);
    }

    public entry fun create_proposal(admin: &signer, question: String, options: vector<String>) acquires VotingStore {
        let admin_addr = signer::address_of(admin);
        assert!(exists<VotingStore>(admin_addr), E_STORE_NOT_INITIALIZED);

        let store = borrow_global_mut<VotingStore>(admin_addr);
        assert!(admin_addr == store.owner, E_NOT_OWNER);
        assert!(vector::length(&options) > 0, E_INVALID_PROPOSAL);

        let proposal_id = store.proposal_counter;
        store.proposal_counter = proposal_id + 1;

        let num_options = vector::length(&options);
        let votes = vector::empty<u64>();
        let i = 0;
        while (i < num_options) {
            vector::push_back(&mut votes, 0);
            i = i + 1;
        };

        let voters = table::new<address, bool>();

        let proposal = Proposal {
            id: proposal_id,
            creator: admin_addr,
            question: question,
            options: options,
            votes: votes,
            open: true,
            voters: voters,
        };

        table::add(&mut store.proposals, proposal_id, proposal);
        event::emit(ProposalCreatedEvent {
            id: proposal_id,
            question: question,
            options: options,
        });
    }

    #[only_test]
    use std::string::{utf8};

    #[test(admin = @0x1)]
    public fun test_create_proposal(admin: &signer) {
        init(admin);

        let question = utf8(b"What is your favorite color?");
        let options = vector::empty<String>();
        vector::push_back(&mut options, utf8(b"Red"));
        vector::push_back(&mut options, utf8(b"Blue"));
        vector::push_back(&mut options, utf8(b"Yellow"));
    }

    public entry fun vote (
        voter: &signer,
        owner: address,
        proposal_id: u64,
        choices: vector<u8>
    ) acquires VotingStore {
        let store = borrow_global_mut<VotingStore>(owner);
        let proposal = table::borrow_mut(&mut store.proposals, proposal_id);

        let voter_addr = signer::address_of(voter);
        assert!(proposal.open, E_PROPOSAL_CLOSED);
        assert!(!table::contains(&proposal.voters, voter_addr), E_ALREADY_VOTED);

        let i = 0;
        let opt_count = vector::length(&proposal.votes);
        while (i < vector::length(&choices)) {
            let choice_u8 = *vector::borrow(&choices, i);
            let choice_idx = (choice_u8 as u64);

            assert!(choice_idx < opt_count, E_PROPOSAL_NOT_FOUND);

            let current = *vector::borrow(&proposal.votes, choice_idx);
            *vector::borrow_mut(&mut proposal.votes, choice_idx) = current + 1;
            i = i + 1;
        };

        table::add(&mut proposal.voters, voter_addr, true);

        event::emit(VotedEvent {
            proposal_id: proposal_id,
            voter: voter_addr,
            choices: choices,
        });
    }

 #[test(admin = @0x1, voter = @0x2)]
 #[expected_failure(abort_code = E_ALREADY_VOTED)]
    public fun test_vote(admin: &signer, voter: &signer) acquires VotingStore {
        // Initialize store for admin
        init(admin);

        // Create proposal with 3 options
        let question = utf8(b"What is your favorite color?");
        let options = vector::empty<String>();
        vector::push_back(&mut options, utf8(b"Red"));    // index 0
        vector::push_back(&mut options, utf8(b"Blue"));   // index 1
        vector::push_back(&mut options, utf8(b"Yellow")); // index 2
        create_proposal(admin, question, options);

        let choices = vector::empty<u8>();
        vector::push_back(&mut choices, 1);
        vote(voter, signer::address_of(admin), 0, choices);
        vote(voter, signer::address_of(admin), 0, choices); // Going to fail
    }

    public entry fun close_proposal(admin: &signer, proposal_id: u64) acquires VotingStore {
        let store = borrow_global_mut<VotingStore>(signer::address_of(admin));
        let proposal = table::borrow_mut(&mut store.proposals, proposal_id);
        assert!(proposal.creator == signer::address_of(admin), E_NOT_OWNER);
        proposal.open = false;

        event::emit(ProposalClosedEvent {
            id: proposal_id,
        });
    }

    #[view]
    public fun get_votes(owner: address, proposal_id: u64): vector<u64> acquires VotingStore {
        let store = borrow_global<VotingStore>(owner);
        let proposal = table::borrow(&store.proposals, proposal_id);
        proposal.votes
    }

    #[test(admin = @0x1)]
    public fun test_close_proposal(admin: &signer) acquires VotingStore {
        init(admin);
        create_proposal(admin, utf8(b"What is your favorite color?"), vector::empty<String>());
        close_proposal(admin, 0);
    }

    #[test(admin = @0x1)]
    #[expected_failure(abort_code = E_STORE_NOT_INITIALIZED)]
    public fun check_error(admin: &signer) acquires VotingStore {
        create_proposal(admin, utf8(b"What is your favorite color?"), vector::empty<String>());
    }

    #[test(admin = @0x1, voter = @0x2)]
    #[expected_failure(abort_code = E_PROPOSAL_CLOSED)]
    public fun close_proposal_test(admin: &signer, voter: &signer) acquires VotingStore {
        init(admin);

        let options = vector::empty<String>();
        vector::push_back(&mut options, utf8(b"Red"));

        create_proposal(admin, utf8(b"What is your favorite color?"), options);
        close_proposal(admin, 0);

        let choices = vector::empty<u8>();
        vector::push_back(&mut choices, 0);

        vote(voter, signer::address_of(admin), 0, choices); // should abort
    }

}