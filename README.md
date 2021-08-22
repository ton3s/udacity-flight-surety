# Flight Surety

FlightSurety project for Udacity's Blockchain course

### Demo

[https://www.youtube.com/watch?v=\_uPq-sAHCTo](https://www.youtube.com/watch?v=_uPq-sAHCTo)

### Libraries

```
# dotenv
Used to load environment variables from a .env file

# truffle-assertions
Helper library to assist with checking for events

# truffle-hdwallet-provider
HD Wallet-enabled Web3 provider. Use it to sign transactions for addresses

# react framework
Javascript library used for building user interfaces
```

### Versions

```
# React verion
v16.13.1

# Truffle version
v5.3.12

# Node version
v12.22.1

# web3 version
v1.2.1
```

## Prerequisites

- Ganache is setup with at least 20 accounts in order to setup 20 oracles

```
ganache-cli --deterministic 100000000 --accounts 20 --networkId 5777 --defaultBalanceEther 1000 --allowUnlimitedContractSize
```

- Import the Mneumonic seed from Ganache into Metamask so you can run the Dapp locally

## Setup

- The contracts, dapps and server are setup in seperate directories. The steps to setup each app are detailed below.

```
# First, clone the project
git clone git@github.com:ton3s/udacity-flight-surety.git
```

### Smart Contracts

- Migrate contracts to setup necessary configuration files (ABI/Settings) for the Dapp and the Oracle Server

```
# Install dependencies
cd flight-surety-contract
npm install

# Configure a .env file with the following:
INFURA_ID=<Infura-Id>
BLOCKCHAIN_PRIVATE_KEY=<Private key of the metamask wallet address>
FIRST_AIRLINE_NAME='Udacity Airlines'
FIRST_AIRLINE_PUBLIC_KEY=<Public key of the metamask wallet address>

# Compile and build the smart contracts
truffle migrate --reset
```

### Dapp

- Dapp was made using the React framework

![Dapp-Screenshot](https://i.imgur.com/rnRCbXk.png)

```
cd flight-surety-dapp
npm install
npm run dapp

# Web browser should open at the following address:
http://localhost:8000/
```

### Oracle/Server

```
cd flight-surety-server
npm install
npm run server
```

If the server is started successfully, you should see the following output:

```
Oracle Registered (0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1): 7, 0, 5
Oracle Registered (0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0): 2, 5, 1
Oracle Registered (0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b): 2, 0, 7
Oracle Registered (0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d): 9, 5, 4
Oracle Registered (0xd03ea8624C8C5987235048901fB614fDcA89b117): 6, 3, 0
Oracle Registered (0x95cED938F7991cd0dFcb48F0a06a40FA1aF46EBC): 4, 5, 7
Oracle Registered (0x3E5e9111Ae8eB78Fe1CC3bb8915d5D461F3Ef9A9): 2, 3, 5
Oracle Registered (0x28a8746e75304c0780E011BEd21C72cD78cd535E): 9, 7, 2
Oracle Registered (0xACa94ef8bD5ffEE41947b4585a84BdA5a3d3DA6E): 8, 2, 4
Oracle Registered (0x1dF62f291b2E969fB0849d99D9Ce41e2F137006e): 6, 9, 7
Oracle Registered (0x610Bb1573d1046FCb8A70Bbbd395754cD57C2b60): 0, 2, 3
.
.
[N number of Oracles]
```

## Tests

- Run the tests for the smart contract

```
cd flight-surety-contract
truffle test
```

- Results of the tests

```
❯ truffle test
Using network 'development'.


Compiling your contracts...
===========================
> Compiling ./contracts/FlightSuretyApp.sol
> Compiling ./contracts/FlightSuretyData.sol
> Artifacts written to /var/folders/nx/s9l1mqt16q9f5y64kgf2pt100000gn/T/test--38131-HVTlSmeOCRmh
> Compiled successfully using:
   - solc: 0.5.16+commit.9c3226ce.Emscripten.clang

Airline #1: Udacity Airlines 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1
Airline #2: American Airlines 0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0
Airline #3: Qantas 0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b
Airline #4: US Airways 0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d
Airline #5: Philippine Airlines 0xd03ea8624C8C5987235048901fB614fDcA89b117
Passenger #1: Wade 0x95cED938F7991cd0dFcb48F0a06a40FA1aF46EBC
Passenger #2: Nash 0x3E5e9111Ae8eB78Fe1CC3bb8915d5D461F3Ef9A9


  Contract: FlightSuretyApp
    ✓ Contract deployment (252ms)
    ✓ Successfully fund a registered airline (256ms)
    ✓ Only existing funded airline may register a new airline (227ms)
    ✓ A registered airline cannot register a new airline (362ms)
    ✓ The fifth airline is queued (586ms)
    ✓ Attempting to fund an airline with less than 10 Ether should fail (227ms)
    ✓ Successfully fund airline 2 with 10 ether (683ms)
    ✓ Queued airline needs at least 50 percent in order to be registered (1058ms)


  8 passing (4s)
```
