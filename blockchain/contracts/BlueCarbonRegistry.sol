// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract BlueCarbonRegistry is Ownable {

    // =====================================================
    // EVIDENCE
    // =====================================================

    struct Evidence {
        bytes32 evidenceHash;
        string projectId;
        string metadataUri;
        uint256 registeredAt;
        address registeredBy;
        bool exists;
    }

    mapping(bytes32 => Evidence) private evidenceRecords;

    event EvidenceRegistered(
        bytes32 indexed evidenceHash,
        string projectId,
        string metadataUri,
        address indexed registeredBy,
        uint256 registeredAt
    );


    // =====================================================
    // CARBON CREDITS
    // =====================================================

    struct CarbonCredit {
        bytes32 evidenceHash;
        string projectId;
        uint256 amount;
        uint256 issuedAt;
        address issuedTo;
        uint256 retiredAmount;
        bool exists;
    }

    mapping(bytes32 => CarbonCredit) private carbonCredits;

    mapping(address => uint256) public creditBalance;


    // =====================================================
    // EVENTS
    // =====================================================

    event CarbonCreditsIssued(
        bytes32 indexed evidenceHash,
        string projectId,
        uint256 amount,
        address indexed issuedTo,
        uint256 issuedAt
    );


    // =====================================================
    // CONSTRUCTOR
    // =====================================================

    constructor()
        Ownable(msg.sender)
    {}


    // =====================================================
    // EVIDENCE REGISTRATION
    // =====================================================

    function registerEvidence(
        bytes32 evidenceHash,
        string calldata projectId,
        string calldata metadataUri
    )
        external
        onlyOwner
    {
        require(
            evidenceHash != bytes32(0),
            "Invalid evidence hash"
        );

        require(
            !evidenceRecords[evidenceHash].exists,
            "Evidence already registered"
        );

        evidenceRecords[evidenceHash] = Evidence({
            evidenceHash: evidenceHash,
            projectId: projectId,
            metadataUri: metadataUri,
            registeredAt: block.timestamp,
            registeredBy: msg.sender,
            exists: true
        });

        emit EvidenceRegistered(
            evidenceHash,
            projectId,
            metadataUri,
            msg.sender,
            block.timestamp
        );
    }


    // =====================================================
    // GET EVIDENCE
    // =====================================================

    function getEvidence(
        bytes32 evidenceHash
    )
        external
        view
        returns (
            bytes32,
            string memory,
            string memory,
            uint256,
            address,
            bool
        )
    {
        Evidence memory evidence =
            evidenceRecords[evidenceHash];

        return (
            evidence.evidenceHash,
            evidence.projectId,
            evidence.metadataUri,
            evidence.registeredAt,
            evidence.registeredBy,
            evidence.exists
        );
    }


    // =====================================================
    // VERIFY EVIDENCE
    // =====================================================

    function verifyEvidence(
        bytes32 evidenceHash
    )
        external
        view
        returns (bool)
    {
        return evidenceRecords[evidenceHash].exists;
    }


    // =====================================================
    // ISSUE CARBON CREDITS
    // =====================================================

    function issueCarbonCredits(
        bytes32 evidenceHash,
        string calldata projectId,
        uint256 amount,
        address issuedTo
    )
        external
        onlyOwner
    {
        require(
            evidenceRecords[evidenceHash].exists,
            "Evidence not registered"
        );

        require(
            amount > 0,
            "Amount must be greater than zero"
        );

        require(
            issuedTo != address(0),
            "Invalid recipient"
        );

        require(
            !carbonCredits[evidenceHash].exists,
            "Credits already issued"
        );

        carbonCredits[evidenceHash] = CarbonCredit({
            evidenceHash: evidenceHash,
            projectId: projectId,
            amount: amount,
            issuedAt: block.timestamp,
            issuedTo: issuedTo,
            retiredAmount: 0,
            exists: true
        });

        creditBalance[issuedTo] += amount;

        emit CarbonCreditsIssued(
            evidenceHash,
            projectId,
            amount,
            issuedTo,
            block.timestamp
        );
    }


    // =====================================================
    // GET CARBON CREDIT INFORMATION
    // =====================================================

    function getCarbonCredit(
        bytes32 evidenceHash
    )
        external
        view
        returns (
            bytes32,
            string memory,
            uint256,
            uint256,
            address,
            uint256,
            bool
        )
    {
        CarbonCredit memory credit =
            carbonCredits[evidenceHash];

        return (
            credit.evidenceHash,
            credit.projectId,
            credit.amount,
            credit.issuedAt,
            credit.issuedTo,
            credit.retiredAmount,
            credit.exists
        );
    }


    // =====================================================
    // GET WALLET CREDIT BALANCE
    // =====================================================

    function getCreditBalance(
        address account
    )
        external
        view
        returns (uint256)
    {
        return creditBalance[account];
    }
}