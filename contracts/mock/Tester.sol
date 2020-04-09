pragma solidity ^0.5.6;

import "./MolochMock.sol";
import "../Minion.sol";

contract Tester {
    // bytes public byt = hex`6969`;
    // string public str = string(hes'6969');

    bytes4 public constant MINION_MAGIC_BYTES = bytes4(keccak256("minion_execute"));

    MolochMock public moloch;
    Minion public minion;
    address public target;


    constructor(address _moloch, address payable _minion, address _target) public {
        moloch = MolochMock(_moloch);
        minion = Minion(_minion);
        target = _target;
    }

    function doTest() public {
        address _to = target;
        uint _nonce = uint(0);
        uint _value = uint(0);
        bytes memory _data = hex'6969';

        bytes memory _badData = hex'696969';

        string memory _details = string(encode(
            _nonce,
            _to,
            _value,
            _data
        ));

        uint _id = moloch.addProposal(address(minion), _details);
        moloch.passProposal(_id);

        minion.execute(
            _id,
            _nonce,
            _to,
            _value,
            _data
        );
    }

    function encode(
        uint _nonce,
        address _to,
        uint _value,
        bytes memory _data
    )
        public pure returns (bytes memory)
    {
        return abi.encodePacked(
            MINION_MAGIC_BYTES,
            _nonce,
            _to,
            _value,
            _data
        );
    }

}
