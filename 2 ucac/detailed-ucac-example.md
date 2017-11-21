# Writing Use Case Authority Contracts on Credit Protocol

Use Case Authority Contracts (UCACs) are custom contracts written in Solidity that are required by the issueCredit function in Credit Protocol. UCACs return a boolean that determines if a specific credit agreement will be written to the blockchain or rejected. We will go through the structure of a UCAC in detail, along with an example UCAC.

## UCACs in Credit Protocol

'Issue Credit' is the core function of Credit Protocol and looks like this:

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

This function is fairly straightforward: it takes in a hash of the UCAC to be used for this function, the Ethereum addresses of the creditor and the debtor along with the amount of the credit agreeement, the digital signatures of both parties, and a short memo. The final 'require' statement in the function involves retrieving the UCAC and then calling it with the address of the creditor, the address of the debtor, and the amount of credit. If this final require statement returns 'true', then the agreement is recorded and an IssueCredit event is emitted.

Here is the code for the Basic UCAC:

```
contract BasicUCAC {
	function allowTransaction (address creditor, address debtor, uint256 amount) public returns (bool) {
		return true;
    } 
}
```

A UCAC takes in the Ethereum address of the creditor, the Ethereum address of the debtor, and the amount of the prospective credit agreement. In this case, the Basic UCAC always returns true, meaning that the credit agreement will be recorded assuming that the correct parameters are passed in. 

Now let's explore a few examples of custom UCACs that place constraints on the recording of credit agreements.

### Example 1: Amount Contraint

This UCAC requires that the amount be between 50 and 500:

```
contract Min50Max500UCAC {
	function allowTransaction (address creditor, address debtor, uint256 amount) public returns (bool) {
		return amount >= 50 && amount <= 500;
    } 
}
```

The constraint is written on one line and is very straightforward: "amount >= 50 && amount <= 500". If the amount falls outside of this range then the UCAC will return false and the issueCredit function will fail.

Now let's look at something a bit more complicated.

### Example 2: Approved Creditor Constraint

The following contract has the capacity to store approved creditor addresses and then checks the creditor address passed to the allowTransaction function against the approved creditors.

```
contract ApprovedCreditor {
    mapping (address => bool) public admins;
    uint public numAdmins;

    mapping (address => bool) public approvedCreditors;
    uint public numCreditors;

    event AdminAdded(address _newAdmin, uint _numAdmins); 
    event CreditorAdded(address _newCreditor, uint _numCreditors);
    event AdminRemoved(address _removedAdmin, uint _numAdmins); 
    event CreditorRemoved(address _removedCreditor, uint _numCreditors);

    function ApprovedCreditor() { // Constructor
        admins[msg.sender] = true;
        approvedCreditors[msg.sender] = true;
        numAdmins = 1;
        numCreditors = 1;
    }

    function addAdmin(address newAdmin) public {
        require(admins[msg.sender]);
        admins[newAdmin] = true;
        numAdmins++;
        AdminAdded(newAdmin, numAdmins);
    }

    function addCreditor(address newCreditor) public {
        require(admins[msg.sender]);
        approvedCreditors[newCreditor] = true;
        numCreditors++;
        CreditorAdded(newCreditor, numCreditors);
    }

    function removeAdmin(address admin) public {
        require(admins[msg.sender]);
        admins[admin] = false;
        numAdmins--;
        AdminRemoved(admin, numAdmins);
    }

    function removeCreditor(address creditor) public {
        require(admins[msg.sender]);
        approvedCreditors[creditor] = false;
        numCreditors--;
        CreditorRemoved(creditor, numCreditors);
    }

	function allowTransaction (address creditor, address debtor, uint256 amount) public returns (bool) {
		return approvedCreditors[creditor];
    }
}

```

This one is a bit more complicated, so let's go through it step by step:
1. The first four lines of code contain the data that we want to store, namely the number of admins, the number of approved creditors, and hashmaps storing the admins and approved creditors. We only need to keep track of if an address is an admin and/or a creditor, so we are mapping to booleans.
2. Next we have events which are used to log whenever an admin or creditor is added or removed.
3. Our first function is the constructor, which sets the contract initializer (msg.sender) as both an admin and an approved creditor, and sets the counts both to 1.
4. The next four functions are used to add and remove admins and creditors, and they all follow the same pattern. First, there is a requirement that the address invoking these functions is an admin, then the correct mapping and count are modified, and finally an event is fired to log the change.
5. Lastly, we have the allowTransaction function which will be invoked from the issueCredit function of Credit Protocol. The code here is once again a single line that simply returns true if the creditor address is in the mapping of approved creditors.

That's all for this UCAC, and we're excited to see what else the community will come up with!

### Looking Forward

In the future, CP may modify the allowTransaction function to accept the memo from issueCredit or some other parameters, further opening up possibilities for agreement confirmation. Stay posted for changes to CP as we, and you, release more dapps built on the blockchain.

