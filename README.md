# Flight Surety

FlightSurety project for Udacity's Blockchain course

## Setup

The contracts, dapps and server are setup in seperate directories. The steps to setup each app are detailed below.

First, clone the project

```
git clone git@github.com:ton3s/udacity-flight-surety.git
```

Migrate contracts to setup necessary configuration files (ABI/Settings) for the Dapp and the Oracle Server

```
cd flight-surety-contract
npm install
truffle migrate --reset
```

Run the Dapp

```
cd flight-surety-dapp
npm install
npm run dapp
```

Run the Oracle/Server

```
cd flight-surety-server
npm install
npm run
```
