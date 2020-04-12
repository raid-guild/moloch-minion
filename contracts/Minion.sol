pragma solidity 0.5.12;

import "./moloch/Moloch.sol";

contract Minion {

    // TODO:
    // - event signatures

    string public constant MINION_ACTION_DETAILS = '{"isMinion": true, "title":"MINION", "description":"';

    Moloch public moloch;
    address public molochApprovedToken;

    // proposalId => Action
    mapping (uint256 => Action) public actions;

    struct Action {
        uint256 value;
        address to;
        bool executed;
        bytes data;
    }

    event ActionProposed(uint256 _proposalId);
    event ActionExecuted(uint256 _proposalId);

    constructor(address _moloch) public {
        moloch = Moloch(_moloch);
        molochApprovedToken = moloch.depositToken();
    }

    function proposeAction(
        address _actionTo,
        uint256 _actionValue,
        bytes memory _actionData,
        string memory _description
    )
        public
        returns (uint256)
    {
        // No calls to zero address allows us to check that Minion submitted
        // the proposal without getting the proposal struct from the moloch
        require(_actionTo != address(0), "Minion::invalid _actionTo");

        string memory details = string(abi.encodePacked(MINION_ACTION_DETAILS, _description, '"}'));

        uint256 proposalId = moloch.submitProposal(
            address(this),
            0,
            0,
            0,
            molochApprovedToken,
            0,
            molochApprovedToken,
            details
        );

        Action memory action = Action({
            value: _actionValue,
            to: _actionTo,
            executed: false,
            data: _actionData
        });

        actions[proposalId] = action;

        emit ActionProposed(proposalId);
        return proposalId;
    }

    function executeAction(uint256 _proposalId) public returns (bytes memory) {
        Action memory action = actions[_proposalId];
        bool[6] memory flags = moloch.getProposalFlags(_proposalId);

        require(action.to != address(moloch), "Minion::invalid target");
        require(action.to != address(0), "Minion::invalid _proposalId");
        require(!action.executed, "Minion::action executed");
        require(address(this).balance >= action.value, "Minion::insufficient eth");
        require(flags[2], "Minion::proposal not passed");

        // do call
        actions[_proposalId].executed = true;
        (bool success, bytes memory retData) = action.to.call.value(action.value)(action.data);
        require(success, "Minion::call failure");
        emit ActionExecuted(_proposalId);
        return retData;
    }

    function() external payable { }
}
