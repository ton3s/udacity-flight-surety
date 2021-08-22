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

    struct Flight {
        string flightNumber;
        uint256 flightTime;        
        address airline;
        uint8 statusCode;
        bool isPaid;
        bool exists;
        address[] insuredPassengers;
    }

    struct Passenger {
        string name;
        uint withdrawBalance;
        bool exists;
        mapping(bytes32 => uint) insuredFlights;
    }

    // Running counter of registered airlines
    uint private registeredAirlinesCount = 0;

    mapping(address => Airline) private airlines;
    mapping(bytes32 => Flight) private flights;
    mapping(address => Passenger) private passengers;

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
        if (!airlines[airline].exists) {
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

    // Flights functions
    function isFlightRegistered(address airline, string calldata flightNumber, uint256 flightTime) external view returns (bool) {
        bytes32 flightKey = getFlightKey(airline, flightNumber, flightTime);
        return flights[flightKey].exists;
    }

    function isFlightPaid(address airline, string calldata flightNumber, uint256 flightTime) external view returns (bool) {
        bytes32 flightKey = getFlightKey(airline, flightNumber, flightTime);
        return flights[flightKey].isPaid;
    }

    function getFlightKey(address airline, string memory flight, uint256 timestamp) pure internal returns(bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Passengers functions
    function isPassengerExists(address passenger) external view returns (bool) {
        return passengers[passenger].exists;
    }

    function getPassengerWithdrawBalance(address passenger) external view returns (uint) {
        return passengers[passenger].withdrawBalance;
    }

    function getPassengerName(address passenger) external view returns (string memory) {
        return passengers[passenger].name;
    }

    function registerFlight(address airline, string calldata flightNumber, uint256 flightTime, uint8 statusCode) external returns (bytes32 flightKey) {

         // Generate a unique key for storing the flight details
        flightKey = getFlightKey(airline, flightNumber, flightTime);
        
        // Register the flight
        Flight storage flight = flights[flightKey];
        flight.flightNumber = flightNumber;
        flight.flightTime = flightTime;
        flight.airline = msg.sender;
        flight.statusCode = statusCode;
        flight.exists = true;
        flight.isPaid = false;
    }

    function setFlightStatus(address airline, string calldata flightNumber, uint256 flightTime, uint8 statusCode) external returns (bytes32 flightKey) {
        flightKey = getFlightKey(airline, flightNumber, flightTime);
        flights[flightKey].statusCode = statusCode;
    }

    function getFlightStatus(address airline, string calldata flightNumber, uint256 flightTime) external view returns (uint8) {
        bytes32 flightKey = getFlightKey(airline, flightNumber, flightTime);
        return flights[flightKey].statusCode;
    }

    // Passenger Functions
    function buyInsurance(address passenger, string calldata name, address airline, string calldata flightNumber, uint256 flightTime, uint amount) external returns (bytes32 flightKey) {
        flightKey = getFlightKey(airline, flightNumber, flightTime);

        // Check if passenger has previously bought insurance for this flight
        address[] storage insuredPassengers = flights[flightKey].insuredPassengers;
        for (uint i=0; i < insuredPassengers.length; i++) {
            if (insuredPassengers[i] == passenger) {
                revert("Passenger has already purchased insurance for this flight");   
            }
        }
        
        // Add passenger to insured passengers list for the flight
        insuredPassengers.push(passenger);
        
        // Register passenger if they have not been created previously
        if (passengers[passenger].exists == false) {
            Passenger storage newPassenger = passengers[passenger];
            newPassenger.name = name;
            newPassenger.withdrawBalance = 0;
            newPassenger.exists = true;
        }
        
        // Add balance paid for the insured flight
        passengers[passenger].insuredFlights[flightKey] = amount;
    }
    
    function creditInsurees(address airline, string calldata flightNumber, uint256 flightTime) external returns (bytes32 flightKey) {
        flightKey = getFlightKey(airline, flightNumber, flightTime);

        address[] storage insuredPassengers = flights[flightKey].insuredPassengers;
        for (uint i=0; i < insuredPassengers.length; i++) {
            address passengerAddress = insuredPassengers[i];
            uint credit = SafeMath.div(SafeMath.mul(passengers[passengerAddress].insuredFlights[flightKey], 150), 100);
            
            // Set balance to 0 for insured passenger
            passengers[passengerAddress].insuredFlights[flightKey] = 0;
            
            // Add credit to current withdraw balance
            passengers[passengerAddress].withdrawBalance = SafeMath.add(passengers[passengerAddress].withdrawBalance, credit);
        }
        
        // Set flight paid status
        flights[flightKey].isPaid = true;
    }

    function withdrawFunds(address payable passenger) external {
        // Store the amount to be sent to the passenger
        uint amountOwed = passengers[passenger].withdrawBalance;

        // Reset passengers withdrawal balance to 0 
        passengers[passenger].withdrawBalance = 0;

        // Send funds to passenger
        passenger.transfer(amountOwed);
    }

    function() external payable {
    }
}