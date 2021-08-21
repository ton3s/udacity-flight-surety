# Flight Surety

FlightSurety project for Udacity's Blockchain course

### Libraries

```
# dotenv
Used to load environment variables from a .env file

# truffle-assertions
Helper library to assist with checking for events

# truffle-hdwallet-provider
HD Wallet-enabled Web3 provider. Use it to sign transactions for addresses
```

### Versions

```
# Truffle version
v5.3.12

# Node version
v12.22.1

# web3 version
v1.2.1
```

## Prerequisites

- Ganache is setup with at least 20 accounts in order to setup 20 oracles
- Import the Mneumonic seed from Ganache into Metamask so you can run the Dapp locally

## Setup

The contracts, dapps and server are setup in seperate directories. The steps to setup each app are detailed below.

First, clone the project

```
git clone git@github.com:ton3s/udacity-flight-surety.git
```

### Smart Contracts

Migrate contracts to setup necessary configuration files (ABI/Settings) for the Dapp and the Oracle Server

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
