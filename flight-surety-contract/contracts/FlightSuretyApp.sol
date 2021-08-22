// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

interface IFlightSurety {

    // Airlines
    function isOperational() external view returns(bool);
    function isAirlineExists(address airline) external view returns (bool);
    function isAirlineQueued(address airline) external view returns (bool);
    function isAirlineRegistered(address airline) external view returns (bool);
    function isAirlineFunded(address airline) external view returns (bool);
    function getRegisteredAirlinesCount() external view returns (uint);
    function getAirlineName(address airline) external view returns (string memory);
    function queueAirline(string calldata name, address airline) external;
    function registerAirline(string calldata name, address airline) external;
    function isUniqueVote(address airline, address votingAirline) external view returns (bool);
    function voteAirline(address airline, address votingAirline) external;
    function getAirlineVotes(address airline) external view returns (address[] memory);
    function fundAirline(address airline) external payable;

    // Flights
    function isFlightRegistered(address airline, string calldata flightNumber, uint256 flightTime) external view returns (bool);
    function isFlightPaid(address airline, string calldata flightNumber, uint256 flightTime) external view returns (bool);
    function registerFlight(address airline, string calldata flightNumber, uint256 flightTime, uint8 statusCode) external returns (bytes32 flightKey);
    function setFlightStatus(address airline, string calldata flightNumber, uint256 flightTime, uint8 statusCode) external returns (bytes32 flightKey);
    function getFlightStatus(address airline, string calldata flightNumber, uint256 flightTime) external view returns (uint8);

    // Passengers
    function isPassengerExists(address passenger) external view returns (bool);
    function getPassengerWithdrawBalance(address passenger) external view returns (uint);
    function getPassengerName(address passenger) external view returns (string memory);
    function buyInsurance(address passenger, string calldata name, address airline, string calldata flightNumber, uint256 flightTime, uint amount) external returns (bytes32 flightKey);
    function creditInsurees(address airline, string calldata flightNumber, uint256 flightTime) external returns (bytes32 flightKey);
    function withdrawFunds(address payable passenger) external;
}

contract FlightSuretyApp {
    using SafeMath for uint256;
    
    // Number of airlines that can registered immediately before
    // a consensus vote is required
    uint private constant AIRLINES_REGISTRATION_LIMIT = 4;  
    uint private constant FUNDING_REQUIRED = 10 ether;
    uint private constant MAX_INSURANCE_PRICE = 1 ether;
    
    IFlightSurety flightSurety;
    address private contractOwner; 
    
    // Flight status codes
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;
    
    // Events
    event AirlineRegistered(string name, address airline);
    event AirlineQueued(string name, address airline);
    event AirlineFunded(string name, address airline);
    event AirlineVoted(string name, address fromAirline, address toAirline);
    event FlightRegistered(string flightNumber, uint flightTime, address airline, bytes32 flightKey);
    event FlightStatus(string flightNumber, uint flightTime, address airline, uint8 statusCode, bytes32 flightKey);
    event FlightCreditInsurees(string flightNumber, uint flightTime, address airline, bytes32 flightKey);
    event PassengerPurchasedInsurance(string name, bytes32 flightKey, address passenger, uint amount);
    event PassengerWithdrawBalance(string name, address passenger, uint amount);
    
     modifier requireIsOperational() {
        require(flightSurety.isOperational(), "Contract is currently not operational");
        _; 
    }

    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }
    
    // Check if the airline is registered
    modifier isAirlineRegistered(address airline) {
        require(flightSurety.isAirlineExists(airline), "Airline does not exist");
        require(flightSurety.isAirlineRegistered(airline), "Airline is not registered");
        _;
    }
    
    // Check if airline has been queued
    modifier isAirlineQueued(address airline) {
        require(flightSurety.isAirlineExists(airline), "Airline does not exist");
        require(flightSurety.isAirlineQueued(airline), "Airline is not queued");
        _;
    }
    
    // Check if an airline is funded
    modifier isAirlineFunded(address airline) {
        require(flightSurety.isAirlineExists(airline), "Airline does not exist");
        require(flightSurety.isAirlineFunded(airline), "Airline is not funded");
        _;
    }

    // Check if airline is registered / funded
    modifier isAirlineRegisteredFunded(address airline) {
        require(flightSurety.isAirlineExists(airline), "Airline does not exist");
        require(flightSurety.isAirlineRegistered(airline) || flightSurety.isAirlineFunded(airline), "Airline is not registered or funded");
        _;
    }

    // Check if the airline address has already been registered
    modifier isNewAirline(address airline) {
        require(flightSurety.isAirlineExists(airline) == false, "Airline has already been registered with this address");
        _;
    }

    // Check if caller has already called this function
    modifier isUniqueVote(address airline, address votingAirline) {
        require(flightSurety.isUniqueVote(airline, votingAirline), "Caller has already voted to registered this airline");
        _;
    }
    
    modifier isFlightRegistered(address airline, string memory flightNumber, uint256 flightTime) {
        require(flightSurety.isFlightRegistered(airline, flightNumber, flightTime), "Flight is not registered");
        _;
    }
    
    // Check if flight has been paid
    modifier isFlightPaid(address airline, string memory flightNumber, uint256 flightTime) {
        require(flightSurety.isFlightPaid(airline, flightNumber, flightTime) == false, "Insured passengers on this late flight have been paid");
        _;
    }
    
     // Define a modifier that checks if the paid amount is sufficient to cover the price
     modifier paidEnough(uint amount) { 
        require(msg.value >= amount, "Ether sent is less than the required amount"); 
        _;
    }
  
    // Check the amount sent and refunds the remaining balance
    modifier checkValue(uint amount) {
        _;
        uint amountToReturn = msg.value - amount;
        msg.sender.transfer(amountToReturn);
    }
    
    // Check passenger pays at least 1 ether for insurance
    modifier paidEnoughForInsurance() {
        require(msg.value > 0, "Need to send ether in order to purchase insurance");
        require(msg.value <= MAX_INSURANCE_PRICE, "Maximum amount that can be paid for insurance is 1 ether");
        _;
    }
    
    // Check if passenger exits
    modifier isPassenger(address passenger) {
        require(flightSurety.isPassengerExists(passenger), "Passenger does not exists");
        _;
    }
    
    // Check if passenger is eligible to withdraw
    modifier canPassengerWithdrawBalance(address passenger) {
        require(flightSurety.getPassengerWithdrawBalance(passenger) > 0, "Passenger does not have balance eligible for withdrawal");
        _;
    }
    
    constructor(address dataContract) public {
        contractOwner = msg.sender;
        flightSurety = IFlightSurety(dataContract);
    }
    
    // *******************
    // Airline functions
    // *******************
    function registerAirline(string memory name, address airline) 
        requireIsOperational
        isNewAirline(airline)
        isAirlineFunded(msg.sender) public {
        
        // Queue the airline if the airline registration limit is exceeded
        if (flightSurety.getRegisteredAirlinesCount() >= AIRLINES_REGISTRATION_LIMIT) {
            flightSurety.queueAirline(name, airline);
            emit AirlineQueued(name, airline);
        }
        else {
            // Register the airline
            flightSurety.registerAirline(name, airline);
            emit AirlineRegistered(name, airline);
        }
    }
    
    function voteAirline(address airline) 
        requireIsOperational
        isAirlineQueued(airline) 
        isAirlineRegisteredFunded(msg.sender) 
        isUniqueVote(airline, msg.sender) public {
     
        flightSurety.voteAirline(airline, msg.sender);
        emit AirlineVoted(flightSurety.getAirlineName(airline), msg.sender, airline);

        // Check if airline has the required number of votes 50%+
        if (flightSurety.getAirlineVotes(airline).length > SafeMath.div(flightSurety.getRegisteredAirlinesCount(), 2)) {
            flightSurety.registerAirline(flightSurety.getAirlineName(airline), airline);
            emit AirlineRegistered(flightSurety.getAirlineName(airline), airline);
        }
    }
    
    function fundAirline() 
        isAirlineRegistered(msg.sender) 
        requireIsOperational
        paidEnough(FUNDING_REQUIRED) 
        checkValue(FUNDING_REQUIRED) external payable {
        
        flightSurety.fundAirline.value(msg.value)(msg.sender);
        emit AirlineFunded(flightSurety.getAirlineName(msg.sender), msg.sender);
    }
    
    // *******************
    // Flights functions
    // *******************
    
    // Only funded airlines can register flights that passengers can insure against
    function registerFlight(string calldata flightNumber, uint256 flightTime) 
        requireIsOperational
        isAirlineFunded(msg.sender) external {
        
        bytes32 flightKey = flightSurety.registerFlight(msg.sender, flightNumber, flightTime, STATUS_CODE_UNKNOWN); 
        emit FlightRegistered(flightNumber, flightTime, msg.sender, flightKey);
    }
    
    function processFlightStatus(address airline, string memory flightNumber, uint256 flightTime, uint8 statusCode) 
        requireIsOperational
        isAirlineFunded(airline)
        isFlightRegistered(airline, flightNumber, flightTime) public {
                    
        // Set the status for the flight
        bytes32 flightKey = flightSurety.setFlightStatus(airline, flightNumber, flightTime, statusCode);
        
        // If flight status is STATUS_CODE_LATE_AIRLINE then refund all users that
        // have insurance for this flight 1.5x
        if (flightSurety.getFlightStatus(airline, flightNumber, flightTime) == STATUS_CODE_LATE_AIRLINE) {
            creditInsurees(airline, flightNumber, flightTime);
        }
        emit FlightStatus(flightNumber, flightTime, airline, statusCode, flightKey);
    }
    
    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus(address airline, string calldata flight, uint256 timestamp) 
        requireIsOperational external {

        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        oracleResponses[key] = ResponseInfo({
                                                requester: msg.sender,
                                                isOpen: true
                                            });

        emit OracleRequest(index, airline, flight, timestamp);
    } 

    // *********************
    // Passengers functions
    // *********************
    
    function buyInsurance(string calldata name, address airline, string calldata flightNumber, uint256 flightTime) 
        requireIsOperational
        isAirlineFunded(airline)
        isFlightRegistered(airline, flightNumber, flightTime)
        paidEnoughForInsurance external payable {
                
        // Check if flight is not late and eligible for passengers to purchase insurance
        require(flightSurety.getFlightStatus(airline, flightNumber, flightTime) != STATUS_CODE_LATE_AIRLINE, "Cannot purchase insurance for a flight that is already late");
        
        bytes32 flightKey = flightSurety.buyInsurance(msg.sender, name, airline, flightNumber, flightTime, msg.value);
        emit PassengerPurchasedInsurance(name, flightKey, msg.sender, msg.value);
    }
    
    // Credit funds to passengers that have bought insurance and airline is late
    function creditInsurees(address airline, string memory flightNumber, uint256 flightTime) 
        requireIsOperational
        isFlightRegistered(airline, flightNumber, flightTime)
        isFlightPaid(airline, flightNumber, flightTime) internal {
                
        // Check if flight is late
        require(flightSurety.getFlightStatus(airline, flightNumber, flightTime) == STATUS_CODE_LATE_AIRLINE, "Flight is not late");
        
        // Credit passengers
        bytes32 flightKey = flightSurety.creditInsurees(airline, flightNumber, flightTime); 
        emit FlightCreditInsurees(flightNumber, flightTime, airline, flightKey);
    }
    
    // Insuree withdraws the balance owed
    function withdrawFunds() 
        requireIsOperational
        isPassenger(msg.sender) 
        canPassengerWithdrawBalance(msg.sender) external {
        
        flightSurety.withdrawFunds(msg.sender);
        emit PassengerWithdrawBalance(flightSurety.getPassengerName(msg.sender), msg.sender, flightSurety.getPassengerWithdrawBalance(msg.sender));
    }

    function getPassengerWithdrawBalance(address passenger) external view returns (uint) {
        return flightSurety.getPassengerWithdrawBalance(passenger);
    }

// region ORACLE MANAGEMENT
    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;    

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;

    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;        
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;                                    // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
                                                        // This lets us group responses and identify
                                                        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status);

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);


    // Register an oracle with the contract
    function registerOracle() 
        requireIsOperational
        external payable {
            
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");
        uint8[3] memory indexes = generateIndexes(msg.sender);
        oracles[msg.sender] = Oracle({ isRegistered: true, indexes: indexes });
    }

    function getMyIndexes() view external returns(uint8[3] memory) {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");
        return oracles[msg.sender].indexes;
    }

    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse(uint8 index, address airline, string calldata flight, uint256 timestamp, uint8 statusCode) 
        requireIsOperational external {
        
        require((oracles[msg.sender].indexes[0] == index) || (oracles[msg.sender].indexes[1] == index) || (oracles[msg.sender].indexes[2] == index), "Index does not match oracle request");

        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp)); 
        require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {
            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }

    function getFlightKey(address airline, string memory flight, uint256 timestamp) pure internal returns(bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes(address account) internal returns(uint8[3] memory) {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);
        
        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex(address account) internal returns (uint8) {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }
        return random;
    }

    // endregion
}