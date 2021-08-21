# Flight Surety

FlightSurety project for Udacity's Blockchain course

## Setup

Clone this project, and install the dependencies

```
git clone git@github.com:ton3s/udacity-flight-surety.git
npm install
```

Migrate contracts to setup necessary configuration files (ABI/Settings) from Dapp

```
cd flight-surety-contract
npm install
truffle migrate --reset
```

Runs the dapp in the development mode.

```
cd flight-surety-dapp
npm install
npm run dapp
```

Runs the Oracle/Server in the development mode.

```
cd flight-surety-server
npm install
npm run
```
