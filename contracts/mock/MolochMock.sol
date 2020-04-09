pragma solidity ^0.5.0;

contract MolochMock {

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;

    enum Vote {
        Null, // default value, counted as abstention
        Yes,
        No
    }

    struct Proposal {
        address applicant;
        address __proposer;
        address __sponsor;
        uint256 __sharesRequested;
        uint256 __lootRequested;
        uint256 __tributeOffered;
        address __tributeToken;
        uint256 __paymentRequested;
        address __paymentToken;
        uint256 __startingPeriod;
        uint256 __yesVotes;
        uint256 __noVotes;
        bool[6] flags;
        string details;
        uint256 __maxTotalSharesAndLootAtYesVote;
        mapping(address => Vote) __votesByMember;
    }

    event Withdraw(address indexed memberAddress, address token, uint256 amount);
    event AddProposal(address indexed applicant, uint256 indexed proposalId, string details);

    /////
    // Moloch functions
    /////

    function withdrawBalance(address token, uint256 amount) public {
        emit Withdraw(msg.sender, token, amount);
    }

    function getProposalFlags(uint256 proposalId) public view returns (bool[6] memory) {
        return proposals[proposalId].flags;
    }

    /////
    // Setup functions
    /////

    function addProposal(address applicant, string memory details) public returns (uint256) {
        uint proposalId = proposalCount;
        proposalCount++;
        Proposal storage proposal = proposals[proposalId];
        proposal.applicant = applicant;
        proposal.details = details;

        emit AddProposal(applicant, proposalId, details);
        return proposalId;
    }

    function passProposal(uint256 proposalId) public {
        Proposal storage proposal = proposals[proposalId];
        proposal.flags[2] = true;
    }
}
