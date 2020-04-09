pragma solidity 0.5.12;

import "./moloch/Moloch.sol";

contract Minion {

    // TODO:
    // - should we use a nonce, or just put an executed bool in the Action struct?
        // a nonce allows us to enforce order of execution
        // no nonce is simpler for the frontend
    // - need to play with the details string to get something that wont break when converted to utf8

    bytes4 public constant MINION_MAGIC_HASH = bytes4(keccak256("minion_action"));

    Moloch public moloch;

    mapping (uint256 => Action) actions; // proposalId => Action

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
    }

    function proposeAction(
        uint256 _sharesRequested,
        uint256 _lootRequested,
        uint256 _tributeOffered,
        address _tributeToken,
        uint256 _paymentRequested,
        address _paymentToken,
        address _actionTo,
        uint256 _actionValue,
        bytes memory _actionData
    )
        public
        returns (uint256)
    {
        // No calls to the zero address allows us to check that
        // we submitted the proposal without getting the proposal
        // struct from the moloch
        require(_actionTo != address(0), "Minion::invalid _actionTo");

        string memory details = string(abi.encodePacked(
            MINION_MAGIC_HASH,
            keccak256(abi.encodePacked(_actionTo, _actionValue, _actionData))
        ));

        uint256 proposalId = moloch.submitProposal(
            address(this),
            _sharesRequested,
            _lootRequested,
            _tributeOffered,
            _tributeToken,
            _paymentRequested,
            _paymentToken,
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

        // require(_to != address(moloch), "Minion::invalid action target");
        require(action.to != address(0), "Minion::invalid _proposalId");
        require(!action.executed, "Minion::action exectuted");
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
