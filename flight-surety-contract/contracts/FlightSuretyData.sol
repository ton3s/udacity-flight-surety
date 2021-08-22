// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    enum AirlineState { QUEUED, REGISTERED, FUNDED }

    struct Airline {
        string name;
        AirlineState status;
        address[] votes;
        bool exists;
    }

    // Running counter of registered airlines
    uint private registeredAirlinesCount = 0;

    mapping(address => Airline) private airlines;

    address private contractOwner; 
    bool private operational = true;

    // Modifiers
    modifier requireIsOperational() {
        require(operational, "Contract is currently not operational");
        _; 
    }

    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    constructor(string memory name, address airline) public {
        contractOwner = msg.sender;

        // Register the first airline
        airlines[airline] = Airline({ 
            name: name, 
            status: AirlineState.REGISTERED,
            votes: new address[](0),
            exists: true
        });
        registeredAirlinesCount = SafeMath.add(registeredAirlinesCount, 1);
    }

    function isOperational() external view returns(bool) {
        return operational;  
    }

    function setOperatingStatus(bool mode) external requireContractOwner {
        operational = mode;
    }

    // Airline functions
    function isAirlineExists(address airline) external view returns (bool) {
        return airlines[airline].exists;
    }

    function isAirlineQueued(address airline) external view returns (bool) {
        return airlines[airline].status == AirlineState.QUEUED; 
    }

    function isAirlineRegistered(address airline) external view returns (bool) {
        return airlines[airline].status == AirlineState.REGISTERED; 
    }

    function isAirlineFunded(address airline) external view returns (bool) {
        return airlines[airline].status == AirlineState.FUNDED; 
    }

    function getRegisteredAirlinesCount() external view returns (uint) {
        return registeredAirlinesCount;
    }

    function getAirlineName(address airline) external view returns (string memory) {
        return airlines[airline].name;
    }

    function queueAirline(string calldata name, address airline) external {
        airlines[airline] = Airline({ 
            name: name, 
            status: AirlineState.QUEUED, 
            votes: new address[](0),
            exists: true
        }); 
    }

    function registerAirline(string calldata name, address airline) external {
        if (airlines[airline].exists) {
            // New airline
            airlines[airline] = Airline({ 
                name: name, 
                status: AirlineState.REGISTERED,
                votes: new address[](0),
                exists: true
            });  
        }
        else {
            airlines[airline].status = AirlineState.REGISTERED;
        }
        registeredAirlinesCount = SafeMath.add(registeredAirlinesCount, 1);
    }
    
    function isUniqueVote(address airline, address votingAirline) external view returns (bool) {
        bool isUnique = true;
        for (uint i=0; i < airlines[airline].votes.length; i++) {
            if (airlines[airline].votes[i] == votingAirline) {
                isUnique = false;
                break;
            }
        }
        return isUnique;   
    }

    function voteAirline(address airline, address votingAirline) external {
        airlines[airline].votes.push(votingAirline);
    } 

    function getAirlineVotes(address airline) external view returns (address[] memory) {
        return airlines[airline].votes;
    }

    function fundAirline(address airline) external payable {
        airlines[airline].status = AirlineState.FUNDED;
    }

    function() external payable {
    }
}