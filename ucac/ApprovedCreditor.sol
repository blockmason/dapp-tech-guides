contract VerifiedCreditor {
    mapping (address => bool) public admins;
    uint public numAdmins;

    mapping (address => bool) public approvedCreditors;
    uint public numCreditors;

    event AdminAdded(address _newAdmin, uint _numAdmins); 
    event CreditorAdded(address _newCreditor, uint _numCreditors);
    event AdminRemoved(address _removedAdmin, uint _numAdmins); 
    event CreditorRemoved(address _removedCreditor, uint _numCreditors);

    function VerifiedCreditor() { // Constructor
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

