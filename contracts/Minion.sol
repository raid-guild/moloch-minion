pragma solidity 0.5.12;

import "./moloch/Moloch.sol";

contract Minion {

    // 0xb16903b2
    bytes4 public constant MINION_MAGIC_BYTES = bytes4(keccak256("minion_execute"));

    uint256 public nonce;
    Moloch public moloch;

    event Execute(
        uint256 nonce,
        bytes32 callHash
    );

    constructor(address _moloch) public {
        moloch = Moloch(_moloch);
    }

    // the only function the Actor can call on the parent Moloch
    function doWithdraw(address _token, uint256 _amount) public {
        moloch.withdrawBalance(_token, _amount);
    }

    function execute(
        uint256 _proposalId,
        uint256 _nonce,
        address _to,
        uint256 _value,
        bytes memory _data
    )
        public
        returns (bytes memory)
    {
        require(_nonce == nonce, "Minion::invalid nonce");
        nonce++;

        (
            address applicant,,,,,,,,,,,,
            string memory details,
        ) = moloch.proposals(_proposalId);
        bool[6] memory flags = moloch.getProposalFlags(_proposalId);

        // {4 bytes MAGIC_BYTES}{32 byte nonce}{20 byte target address}{32 byte value}{data}
        bytes32 callHash = keccak256(encodeCall(
            _nonce,
            _to,
            _value,
            _data
        ));
        bytes32 proposedCallHash = keccak256(abi.encodePacked(bytes(details)));

        require(_to != address(moloch), "Minion::invalid action target");
        require(address(this).balance >= _value, "Minion::insufficient eth");
        require(applicant == address(this), "Minion::invalid proposal applicant");
        require(callHash == proposedCallHash, "Minion::invalid call parameters");
        require(flags[2], "Minion::proposal not passed");

        // do call
        (bool success, bytes memory retData) = _to.call.value(_value)(_data);
        require(success, "Minion::call failure");
        return retData;
    }

    function encodeCall(
        uint _nonce,
        address _to,
        uint _value,
        bytes memory _data
    )
        public view returns (bytes memory)
    {
        return abi.encodePacked(
            MINION_MAGIC_BYTES,
            _nonce,
            _to,
            _value,
            _data
        );
    }

    function() external payable { }
}
