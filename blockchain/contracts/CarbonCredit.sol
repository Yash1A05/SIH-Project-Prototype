// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CarbonCredit is ERC20, Ownable {

    // =====================================================
    // CREDIT PROJECT STRUCTURE
    // =====================================================

    struct CreditProject {
        string projectId;
        bytes32 evidenceHash;
        uint256 creditsIssued;
        uint256 creditsRetired;
        uint256 registeredAt;
        bool exists;
    }

    mapping(string => CreditProject) private projects;


    // =====================================================
    // EVENTS
    // =====================================================

    event CarbonCreditsIssued(
        string indexed projectId,
        bytes32 indexed evidenceHash,
        address indexed recipient,
        uint256 amount
    );

    event CarbonCreditsRetired(
        string indexed projectId,
        address indexed account,
        uint256 amount
    );


    // =====================================================
    // CONSTRUCTOR
    // =====================================================

    constructor()
        ERC20("Blue Carbon Credit", "BCC")
        Ownable(msg.sender)
    {}


    // =====================================================
    // TOKEN DECIMALS
    // =====================================================

    // 1 BCC = 1 tonne CO2e
    //
    // Default ERC20 uses 18 decimals.
    // We override it to 0 so that:
    //
    // 1 BCC = 1 tonne CO2e
    //
    // Example:
    // 35,268 tonnes CO2e = 35,268 BCC

    function decimals()
        public
        pure
        override
        returns (uint8)
    {
        return 0;
    }


    // =====================================================
    // ISSUE CARBON CREDITS
    // =====================================================

    function issueCredits(
        string calldata projectId,
        bytes32 evidenceHash,
        address recipient,
        uint256 amount
    )
        external
        onlyOwner
    {
        require(
            evidenceHash != bytes32(0),
            "Invalid evidence hash"
        );

        require(
            recipient != address(0),
            "Invalid recipient"
        );

        require(
            amount > 0,
            "Amount must be greater than zero"
        );

        require(
            !projects[projectId].exists,
            "Project credits already issued"
        );


        projects[projectId] = CreditProject({
            projectId: projectId,
            evidenceHash: evidenceHash,
            creditsIssued: amount,
            creditsRetired: 0,
            registeredAt: block.timestamp,
            exists: true
        });


        _mint(
            recipient,
            amount
        );


        emit CarbonCreditsIssued(
            projectId,
            evidenceHash,
            recipient,
            amount
        );
    }


    // =====================================================
    // RETIRE CARBON CREDITS
    // =====================================================

    function retireCredits(
        string calldata projectId,
        uint256 amount
    )
        external
    {
        require(
            projects[projectId].exists,
            "Project not found"
        );

        require(
            amount > 0,
            "Amount must be greater than zero"
        );

        require(
            balanceOf(msg.sender) >= amount,
            "Insufficient carbon credits"
        );


        _burn(
            msg.sender,
            amount
        );


        projects[projectId].creditsRetired += amount;


        emit CarbonCreditsRetired(
            projectId,
            msg.sender,
            amount
        );
    }


    // =====================================================
    // GET PROJECT CREDIT INFORMATION
    // =====================================================

    function getProject(
        string calldata projectId
    )
        external
        view
        returns (
            string memory,
            bytes32,
            uint256,
            uint256,
            uint256,
            bool
        )
    {
        CreditProject memory project =
            projects[projectId];


        return (
            project.projectId,
            project.evidenceHash,
            project.creditsIssued,
            project.creditsRetired,
            project.registeredAt,
            project.exists
        );
    }


    // =====================================================
    // CHECK AVAILABLE CREDITS
    // =====================================================

    function availableCredits(
        string calldata projectId
    )
        external
        view
        returns (uint256)
    {
        CreditProject memory project =
            projects[projectId];


        if (!project.exists) {
            return 0;
        }


        return
            project.creditsIssued
            - project.creditsRetired;
    }
}