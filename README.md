# Flight Surety

FlightSurety project for Udacity's Blockchain course

## Setup

The contracts, dapps and server are setup in seperate directories. The steps to setup each app are detailed below.

First, clone the project

```
git clone git@github.com:ton3s/udacity-flight-surety.git
```

#### Smart Contracts

Migrate contracts to setup necessary configuration files (ABI/Settings) for the Dapp and the Oracle Server

```
# Install dependencies
cd flight-surety-contract
npm install

# Configure a .env file with the following:
INFURA_ID=<Infura-Id>
BLOCKCHAIN_PRIVATE_KEY=<Private key of the metamask wallet address>

# Compile and build the smart contracts
truffle migrate --reset
```

#### Dapp

```
cd flight-surety-dapp
npm install
npm run dapp
```

#### Oracle/Server

```
cd flight-surety-server
npm install
npm run
```
