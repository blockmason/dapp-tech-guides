# Credit Protocol - A Guide

## The Purpose of CP

Credit Protocol is designed to allow developers to build dapps on Ethereum that require the storage of credit agreements. These agreements are mutually agreed on by two parties and can be customized through Use Case Authority Contracts (see section 2 for UCACs). The information in these agreements is stored on Ethereum and cannot be erased, allowing a degree of permanence and authenticity not found in traditional applications.

## How it Works

Let's go through CP in detail to see how it works. We will approach CP from the perspective of a developer trying to understand and use it for a new distributed application (dapp). The full code is available at https://github.com/blockmason/credit-protocol/blob/master/contracts/CreditProtocol.sol .

### Events

Taking a look at the two CP events shows us what CP is designed to do. We can see that the two primary tools provided by CP are the ability to issue credit and the ability to create custom UCACs.

```
event IssueCredit(bytes32 indexed ucac, address indexed creditor, address indexed debtor, uint256 amount, bytes32 memo);
event UcacCreation(bytes32 indexed ucac, address indexed contractAddr, bytes32 denomination);
```

The IssueCredit event fires whenever credit is issued between two parties. This event logs the ID of the UCAC used to verify the agreement, the addresses of the creditor and debtor, the amount of the agreement, and a short, custom memo.

The UcacCreation event fires whenever a UCAC is created by a developer and "staked" with tokens owned by that developer. In order to create and stake a UCAC, the creator of that UCAC must have Blockmason Credit Protocol Tokens (BCPT). This event logs the ID of the UCAC that was created, the address of the UCAC, and the denomination (currency) of the UCAC.

### Issue Credit

Here is a closer look at the issueCredit function, the core capability of Credit Protocol:

```
function issueCredit( bytes32 ucac, address creditor, address debtor, uint256 amount
                    , bytes32[3] memory sig1
                    , bytes32[3] memory sig2
                    , bytes32 memo
                    ) public {
    require(creditor != debtor);

    bytes32 hash = keccak256(prefix, keccak256(ucac, creditor, debtor, amount, getNonce(creditor, debtor)));

    // verifying signatures
    require(ecrecover(hash, uint8(sig1[2]), sig1[0], sig1[1]) == creditor);
    require(ecrecover(hash, uint8(sig2[2]), sig2[0], sig2[1]) == debtor);

    // checking for overflow
    require(balances[ucac][creditor] < balances[ucac][creditor] + int256(amount));
    // checking for underflow
    require(balances[ucac][debtor] > balances[ucac][debtor] - int256(amount));
    // executeUcacTx will throw if a transaction limit has been reached or the ucac is uninitialized
    executeUcacTx(ucac);
    // check that UCAC contract approves the transaction
    require(BasicUCAC(getUcacAddr(ucac)).allowTransaction(creditor, debtor, amount));

    balances[ucac][creditor] = balances[ucac][creditor] + int256(amount);
    balances[ucac][debtor] = balances[ucac][debtor] - int256(amount);
    IssueCredit(ucac, creditor, debtor, amount, memo);
    incrementNonce(creditor, debtor);
}
```

This is the core of CP, and so is worth going through in detail. The parameters include the ID of the UCAC used to verify the agreement, the address of the creditor, the address of the debtor, the uint amount of the agreement, two bytes32 arrays of length 3 containing the signatures of the creditor (sig1) and the debtor (sig2), and a short memo. There is a requirement that the creditor and the debtor are not the same address.

IMPORTANT - The client, server, and blockchain contract must all agree on the hashing and signature scheme

The next few lines are used to generate the hash and then use that hash to verify that the signatures belong to the creditor and debtor respectively. The ecrecover function is standard convention and is internal to Ethereum.

The function then checks for overflow, ensuring that a creditor's balance cannot go so high that the int then becomes negative. Similarly, the underflow check ensures that a debtor cannot have so much debt that it flips to positive.

"executeUcacTx" is passed the ID of the UCAC to ensure that the UCAC to be used has sufficient token capacity left to process this transaction (see the usage of BCPT).

The last check is the most interesting. It finds the UCAC to be used for this particular transaction based on the ID, then calls the UCAC's "allowTransaction" method with the addresses of the creditor and debtor along with the amount of the credit agreement. This is where customization can be built on top of CP and we explore some of the possibilities of UCACs in another section.

Finally, the issueCredit function adjusts the balances of the creditor and debtor, emits an IssueCredit event, and increments the nonce.

### UCAC Creation

The createAndStakeUcac function allows the community to create their own UCACs to be used for validating agreements. Here is the code:

```
function createAndStakeUcac( address _ucacContractAddr, bytes32 _ucacId
                            , bytes32 _denomination, uint256 _tokensToStake) public {
    // check that _ucacContractAddr points to something meaningful
    require(_ucacContractAddr != address(0));
    // check that _ucacId does not point to an extant UCAC
    require(ucacs[_ucacId].totalStakedTokens == 0 && ucacs[_ucacId].ucacContractAddr == address(0));
    // checking that initial token staking amount is enough to own a UCAC
    require(_tokensToStake >= tokensToOwnUcac);
    stakeTokensInternal(_ucacId, msg.sender, _tokensToStake);
    ucacs[_ucacId].ucacContractAddr = _ucacContractAddr;
    ucacs[_ucacId].denomination = _denomination;
    UcacCreation(_ucacId, _ucacContractAddr, _denomination);
}
```

The parameters include the address of the deployed UCAC contract (it must be deployed to Ethereum prior to calling this function), the prospective UCAC ID, the denomination (currency) of this UCAC, and the number of tokens owned by the msg.sender address that will be used to stake the UCAC. "Staking" is the same as powering or funding the UCAC, and requires that the msg.sender owns enough BCPT to stake a UCAC.

The first three "require" checks are straightforward, they check that a contract exists at the _ucacContractAddr, that the _ucacId does not already exist, and that the _tokensToStake is sufficient to stake a UCAC. "tokensToOwnUcac" is an internal variable in the CP contract set by the Blockmason team.

The next call, "stakeTokensInternal", is to an internal private function that registers the given UCAC using the tokens owned by msg.sender. The next two lines set the address and denomination of the new UCAC.

Finally, the "UcacCreation" event is emitted with the UCAC ID, the contract address, and the denomination of the UCAC.

This is a brief overview of the main Credit Protocol functions. Check out our other guides and explanations for more information on UCAC creation and dapp development.


