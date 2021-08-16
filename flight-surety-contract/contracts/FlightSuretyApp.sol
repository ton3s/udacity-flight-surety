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
    event FlightRegistered(string flightNumber, uint flightTime, address airline);
    event FlightStatus(string flightNumber, uint flightTime, uint8 statusCode);
    event FlightCreditInsurees(string flightNumber, uint flightTime, address airline);
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
    function registerAirline(string memory name, address airline) isAirlineRegisteredFunded(msg.sender) public {
        
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
        
        emit FlightRegistered(flightNumber, flightTime, msg.sender);
    }
    
    function processFlightStatus(address airline, string calldata flightNumber, uint256 flightTime, uint8 statusCode) 
        isAirlineFunded(airline)
        isFlightRegistered(airline, flightNumber, flightTime) external {
            
        // Generate the flightKey to retrieve the flight details
        bytes32 flightKey = keccak256(abi.encodePacked(airline, flightNumber, flightTime));
        
        // Set the status for the flight
        flights[flightKey].statusCode = statusCode;
        
        // If flight status is STATUS_CODE_LATE_AIRLINE then refund all users that
        // have insurance for this flight 1.5x
        if (flights[flightKey].statusCode == STATUS_CODE_LATE_AIRLINE) {
            creditInsurees(airline, flightNumber, flightTime);
        }
        
        emit FlightStatus(flightNumber, flightTime, statusCode);
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
        
        emit FlightCreditInsurees(flightNumber, flightTime, airline);
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
    
    function() external payable {
        fundAirline();
    }
    
}