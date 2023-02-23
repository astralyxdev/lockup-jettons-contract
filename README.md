# Lockup Jettons Contract  
The contract can be used to lock the jettons to a specific recipient, preventing them from being transferred or used until the timer expires or the owner gives them up.

## Interface
- [https://astralyxdev.github.io/lockup-jettons-contract/](https://astralyxdev.github.io/lockup-jettons-contract/)

## Layout
-   `docs` - demo frontend for interacting with contract
-   `contracts` - contains the source code of all the smart contracts of the project and their dependencies.
-   `wrappers` - contains the wrapper classes (implementing `Contract` from ton-core) for the contracts, including any [de]serialization primitives and compilation functions.
-   `tests` - tests for the contracts. Would typically use the wrappers.
-   `scripts` - contains scripts used by the project, mainly the deployment scripts.   

## How to use
* Clone this repo
* Run `yarn install`

### Building a contract
1. Interactively
   * Run `yarn blueprint build`
   * Choose the contract you'd like to build
2. Non-interactively
    * Run `yarn blueprint build jettonLockup`

### Deploying a contract
1. Interactively
   1. Run `yarn blueprint run`
   2. Choose the contract you'd like to deploy
   3. Choose whether you're deploying on mainnet or testnet
   4. Choose how to deploy:
      1. With a TON Connect compatible wallet
      2. A `ton://` deep link / QR code
      3. Tonhub wallet
   5. Deploy the contract
2. Non-interactively
   1. Run `yarn blueprint run jettonLockup --<NETWORK> --<DEPLOY_METHOD>`

### Testing
1. Run `yarn test`


## Additional links
[TLB Scheme](https://github.com/astralyxdev/lockup-jettons-contract/blob/main/contracts/scheme.tlb)

## License
GPLv2
