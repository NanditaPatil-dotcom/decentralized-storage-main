// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DecentralizedStorage {
    mapping(address => string[]) private userFiles;

    event FileUploaded(address indexed user, string cid);

    function uploadFile(string memory cid) public {
        userFiles[msg.sender].push(cid);
        emit FileUploaded(msg.sender, cid);
    }

    function getFiles(address user) public view returns (string[] memory) {
        return userFiles[user];
    }
}
