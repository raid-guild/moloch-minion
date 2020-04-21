pragma solidity ^0.5.0;

contract RevertingMoloch {
    address public depositToken;

    function submitProposal(
        address applicant,
        uint256 sharesRequested,
        uint256 lootRequested,
        uint256 tributeOffered,
        address tributeToken,
        uint256 paymentRequested,
        address paymentToken,
        string memory details
    ) public returns (uint256 proposalId) {
        revert();
    }
}
