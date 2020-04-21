pragma solidity ^0.5.0;

contract TargetMock {

    event Called(
        address indexed caller,
        uint indexed value,
        bytes data
    );

    function fail() external payable {
        revert();
    }

    function() external payable {
        // bytes memory data;
        // assembly{
        //     let _size := calldatasize
        //     mstore(data, _size)
        //     calldatacopy(add(data, 0x20), 0x00, size)
        // }
        // emit Called(msg.sender, msg.value, data);
        emit Called(msg.sender, msg.value, msg.data);
    }
}
