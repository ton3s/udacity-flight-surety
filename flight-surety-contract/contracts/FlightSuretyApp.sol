// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyApp {
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
        uint withdrawBalance;
        bool exists;
        mapping(bytes32 => uint) insuredFlights;
    }
    
    // Number of airlines that can registered immediately before
    // a consensus vote is required
    uint private constant AIRLINES_REGISTRATION_LIMIT = 3;  
    uint private constant FUNDING_REQUIRED = 10 ether;
    uint private constant MAX_INSURANCE_PRICE = 1 ether;
    
    // Running counter of registered airlines
    uint public registeredAirlinesCount = 0;
    
    mapping(address => Airline) public airlines;
    mapping(bytes32 => Flight) public flights;
    mapping(address => Passenger) public passengers;
    
    bool private operational = true;
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
    event PassengerPurchasedInsurance(bytes32 flightKey, address passenger, uint amount);
    event PassengerWithdrawBalance(address passenger, uint amount);
    
    // Modifiers
    modifier requireIsOperational() {
        require(operational, "Contract is currently not operational");
        _; 
    }
    
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }
    
    // Check if the airline is registered
    modifier isAirlineRegistered(address airline) {
        require(airlines[airline].exists == true, "Airline does not exist");
        require(airlines[airline].status == AirlineState.REGISTERED, "Airline is not registered");
        _;
    }
    
    // Check if airline has been queued
    modifier isAirlineQueued(address airline) {
        require(airlines[airline].exists == true, "Airline does not exist");
        require(airlines[airline].status == AirlineState.QUEUED, "Airline is not queued");
        _;
    }
    
    // Check if an airline is funded
    modifier isAirlineFunded(address airline) {
        require(airlines[airline].exists == true, "Airline does not exist");
        require(airlines[airline].status == AirlineState.FUNDED, "Airline is not funded");
        _;
    }

    // Check if airline is registered / funded
    modifier isAirlineRegisteredFunded(address airline) {
        require(airlines[airline].exists == true, "Airline does not exist");
        require(airlines[airline].status == AirlineState.REGISTERED || airlines[airline].status == AirlineState.FUNDED, "Airline is not registered or funded");
        _;
    }

    // Check if the airline address has already been registered
    modifier isNewAirline(address airline) {
        require(airlines[airline].exists == false, "Airline has already been registered with this address");
        _;
    }
    
    modifier isFlightRegistered(address airline, string memory flightNumber, uint256 flightTime) {
        bytes32 flightKey = keccak256(abi.encodePacked(airline, flightNumber, flightTime));
        require(flights[flightKey].exists == true, "Flight is not registered");
        _;
    }
    
    // Check if flight has been paid
    modifier isFlightPaid(address airline, string memory flightNumber, uint256 flightTime) {
        bytes32 flightKey = keccak256(abi.encodePacked(airline, flightNumber, flightTime));
        require(flights[flightKey].isPaid == false, "Insured passengers on this late flight have been paid");
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
        require(passengers[passenger].exists == true, "Passenger does not exists");
        _;
    }
    
    // Check if passenger is eligible to withdraw
    modifier canPassengerWithdrawBalance(address passenger) {
        require(passengers[passenger].withdrawBalance > 0, "Passenger does not have balance eligible for withdrawal");
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
    
    // *******************
    // Airline functions
    // *******************
    function registerAirline(string memory name, address airline) 
        isNewAirline(airline)
        isAirlineRegisteredFunded(msg.sender) public {
        
        // Queue the airline if the airline registration limit is exceeded
        if (registeredAirlinesCount >= AIRLINES_REGISTRATION_LIMIT) {
            
            // Queue the airline
            airlines[airline] = Airline({ 
                name: name, 
                status: AirlineState.QUEUED, 
                votes: new address[](0),
                exists: true
            }); 
            
            emit AirlineQueued(name, airline);
        }
        else {
            
            // Register the airline
            airlines[airline] = Airline({ 
                name: name, 
                status: AirlineState.REGISTERED,
                votes: new address[](0),
                exists: true
            });  
            registeredAirlinesCount = SafeMath.add(registeredAirlinesCount, 1);
            
            emit AirlineRegistered(name, airline);
        }
    }
    
    function voteAirline(address airline) 
        isAirlineQueued(airline) 
        isAirlineRegisteredFunded(msg.sender) public {
        
         // Check if caller has already called this function
        bool isDuplicate = false;
        for (uint i=0; i < airlines[airline].votes.length; i++) {
            if (airlines[airline].votes[i] == msg.sender) {
                isDuplicate = true;
                break;
            }
        }
        require(!isDuplicate, "Caller has already voted to registered this airline");

        airlines[airline].votes.push(msg.sender);
        emit AirlineVoted(airlines[airline].name, msg.sender, airline);

        // Check if airline has the required number of votes 50%+
        if (airlines[airline].votes.length > SafeMath.div(registeredAirlinesCount, 2)) {
            airlines[airline].status = AirlineState.REGISTERED;
            registeredAirlinesCount = SafeMath.add(registeredAirlinesCount, 1);
            
            emit AirlineRegistered(airlines[airline].name, airline);
        }
    }
    
    function fundAirline() isAirlineRegistered(msg.sender) 
        paidEnough(FUNDING_REQUIRED) 
        checkValue(FUNDING_REQUIRED) public payable {
        airlines[msg.sender].status = AirlineState.FUNDED;
        
        emit AirlineFunded(airlines[msg.sender].name, msg.sender);
    }
    
    // *******************
    // Flights functions
    // *******************
    
    // Only funded airlines can register flights that passengers can insure against
    function registerFlight(string calldata flightNumber, uint256 flightTime) isAirlineFunded(msg.sender) external {
        
        // Generate a unique key for storing the flight details
        bytes32 flightKey = keccak256(abi.encodePacked(msg.sender, flightNumber, flightTime));
        
        // Register the flight
        Flight storage flight = flights[flightKey];
        flight.flightNumber = flightNumber;
        flight.flightTime = flightTime;
        flight.airline = msg.sender;
        flight.statusCode = STATUS_CODE_UNKNOWN;
        flight.exists = true;
        flight.isPaid = false;
        
        emit FlightRegistered(flightNumber, flightTime, msg.sender, flightKey);
    }
    
    function processFlightStatus(address airline, string memory flightNumber, uint256 flightTime, uint8 statusCode) 
        isAirlineFunded(airline)
        isFlightRegistered(airline, flightNumber, flightTime) public {
            
        // Generate the flightKey to retrieve the flight details
        bytes32 flightKey = keccak256(abi.encodePacked(airline, flightNumber, flightTime));
        
        // Set the status for the flight
        flights[flightKey].statusCode = statusCode;
        
        // If flight status is STATUS_CODE_LATE_AIRLINE then refund all users that
        // have insurance for this flight 1.5x
        if (flights[flightKey].statusCode == STATUS_CODE_LATE_AIRLINE) {
            creditInsurees(airline, flightNumber, flightTime);
        }
        
        emit FlightStatus(flightNumber, flightTime, airline, statusCode, flightKey);
    }
    
    // *********************
    // Passengers functions
    // *********************
    
    function buyInsurance(address airline, string calldata flightNumber, uint256 flightTime) 
        isAirlineFunded(airline)
        isFlightRegistered(airline, flightNumber, flightTime)
        paidEnoughForInsurance external payable {
        
        // Generate the flightKey to retrieve the flight details
        bytes32 flightKey = keccak256(abi.encodePacked(airline, flightNumber, flightTime));
        
        // Check if flight is not late and eligible for passengers to purchase insurance
        require(flights[flightKey].statusCode != STATUS_CODE_LATE_AIRLINE, "Cannot purchase insurance for a flight that is already late");
        
        // Check if passenger has previously bought insurance for this flight
        address[] storage insuredPassengers = flights[flightKey].insuredPassengers;
        for (uint i=0; i < insuredPassengers.length; i++) {
            if (insuredPassengers[i] == msg.sender) {
                revert("Passenger has already purchased insurance for this flight");   
            }
        }
        
        // Add passenger to insured passengers list for the flight
        insuredPassengers.push(msg.sender);
        
        // Register passenger if they have not been created previously
        if (passengers[msg.sender].exists == false) {
            Passenger storage passenger = passengers[msg.sender];
            passenger.withdrawBalance = 0;
            passenger.exists = true;
        }
        
        // Add balance paid for the insured flight
        passengers[msg.sender].insuredFlights[flightKey] = msg.value;
        
        emit PassengerPurchasedInsurance(flightKey, msg.sender, msg.value);
    }
    
    // Credit funds to passengers that have bought insurance and airline is late
    function creditInsurees(address airline, string memory flightNumber, uint256 flightTime) 
        isFlightRegistered(airline, flightNumber, flightTime)
        isFlightPaid(airline, flightNumber, flightTime) internal {
        
        // Generate the flightKey to retrieve the flight details
        bytes32 flightKey = keccak256(abi.encodePacked(airline, flightNumber, flightTime));
        
        // Check if flight is late
        require(flights[flightKey].statusCode == STATUS_CODE_LATE_AIRLINE, "Flight is not late");
        
        // Credit passengers
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
        
        emit FlightCreditInsurees(flightNumber, flightTime, airline, flightKey);
    }
    
    // Insuree withdraws the balance owed
    function withdrawFunds() 
        isPassenger(msg.sender) 
        canPassengerWithdrawBalance(msg.sender) external {
        
        // Store the amount to be sent to the passenger
        uint amountOwed = passengers[msg.sender].withdrawBalance;

        // Reset passengers withdrawal balance to 0 
        passengers[msg.sender].withdrawBalance = 0;

        // Send funds to passenger
        msg.sender.transfer(amountOwed);
        
        emit PassengerWithdrawBalance(msg.sender, amountOwed);
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
    function registerOracle() external payable {
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
    function submitOracleResponse(uint8 index, address airline, string calldata flight, uint256 timestamp, uint8 statusCode) external {
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
    
    function() external payable {
        fundAirline();
    }
    
}