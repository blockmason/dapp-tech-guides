# The New DApp Infrastructure

#### Outline
1. Proposed infrastructure for a dApp
2. Authentication & Security
3. How to build on top of Credit Protocol

## Introduction
The rise of the Ethereum network and the new possibilities around applications that leverage the advantages of immutable data storage and contract execution on blockchain tech are exciting, but there is a lack of best practices, libraries, and documentation that can be used to build fully-functional, consumer-facing distributed applications (dApps). To address this gap, we at Blockmason want to propose some best practices that fully consider the strengths and weaknesses of blockchains and traditional web infrastructure based on the development of our most recent dApp: Lndr.

### Structure of the DApp Stack
Successful dApps will have to provide the speed and usability that users expect from regular apps by using a combination of traditional and distributed infrastructure. The average user will not be convinced to use a more secure, reliable app if simple transactions take over 10 seconds to execute. Here is a blueprint for a sample dApp:

Data Storage:
PostgreSQL (any DB will work)
Solidity / Ethereum


Server:	
Haskell / REST / AWS
(any server language, framework and
Infrastructure will work)


User Interface:
React Native (or Java / Swift / website)


This architecture is designed to optimize the functionality of the dApp using both traditional infrastructure and blockchain. Due to the slow processing time of Ethereum (currently somewhere around 15 seconds), depending on it for all data processing and storage is both impractical and undesirable. The goal of any dApp backend should be to keep as much logic as possible on a traditional server. Blockchain storage and contract logic should be kept to the minimum necessary for the core functionality of the dApp to reduce ether costs and improve speed. Any data that does not need to be stored on the blockchain can be stored in a relational database.

In the case of Lndr, we use an AWS EC2 instance running a Haskell REST server to communicate between the React Native app, the Blockmason Credit Protocol contract on Ethereum (written in Solidity), and a PostgreSQL database. The core value proposition of Lndr is its ability to store immutable credit agreements on the Ethereum blockchain that have been digitally signed by both parties. Keeping this in mind, it becomes apparent that agreements that have only been signed by a single party and any supplemental information -- such as names, friends, groups, and payment info -- do not need to be stored on the blockchain. All of this supplemental information is stored in a traditional database along with any unconfirmed credit agreements. Once both parties have signed an agreement, the server writes the completed agreement to the blockchain. The end result is a system that only communicates with the blockchain when it is absolutely necessary to do so, while storing the minimum amount of information necessary for the dApp.

### Authentication and Security
Secure authentication is a key benefit of blockchains, and successful implementation requires a thorough understanding of how to create, store, and use private and public keys through all levels of a dApp’s stack. Let’s trace the full authentication flow of a mobile app using Lndr as an example:

Flow:

Private key is generated on mobile device
All messages to server are signed with key




Server validates messages with public key




Credit Protocol contract validates signatures 
	using public keys


The process starts when a user loads the app for the first time and a private key unique to that user’s phone is created. The key is stored on the user’s phone using a SQLite database that can only be accessed by the Lndr dApp. The new private key is used to sign all messages sent to the server, which allows the server to validate every incoming message using public keys. No authentication information is stored on the server or in the supplemental database, providing a level of security not currently present in most consumer apps.
In the case of Lndr, we used ___, ___, and ___ libraries to generate and store private keys, and we used ___ to validate messages coming to the server. These libraries required some minor configuration to work with React Native, and additional development will be needed in the future to ensure reliability for dApps.

### Building on top of Credit Protocol
Successful protocols built on top of Ethereum should be flexible enough to accommodate a wide variety of use cases, while also being completely secure and reliable. Blockmason’s Credit Protocol enables developers to customize how credit agreements are stored on Ethereum through Use Case Authority Contracts (UCACs).
Credit Protocol is a Solidity contract deployed to Ethereum that allows developers to write credit agreements to the blockchain using Blockmason Credit Protocol Tokens (BCPT). CP is designed to be a simple foundation that developers can leverage to build more complicated dApps to store and analyze credit agreements. UCACs are the customizable Solidity contracts that allow for customization within the framework of CP. Let’s explore how a UCAC works and some possible applications for their extensibility.
The Solidity code for the Basic UCAC always returns true for any credit agreement that supplies the address of the creditor, the address of the debtor, and the amount of credit: 

```
contract BasicUCAC {
	function allowTransaction (address creditor, address debtor, uint256 amount) public returns (bool) {
		return true;
    } 
}
```

While this UCAC is sufficient for the purposes of Lndr, through which any two users can record a credit agreement for any amount. But other dApps might want to place additional restrictions on recording credit agreements. A custom UCAC can be used to ensure agreements meet certain constraints before the agreement is stored on the blockchain. Possible constraints include: a minimum or maximum limit on the amount of credit, a mandatory memo format that includes an interest rate and a date of repayment, or a requirement that only certain creditor addresses (such as approved loan officers) are able to sign agreements.
	A constraint on the amount in an agreement would like this:

```
contract Min50Max500UCAC {
	function allowTransaction (address creditor, address debtor, uint256 amount) public returns (bool) {
		return amount >= 50 && amount <=500;
    } 
}
```

This is a simple example, and more complicated UCACs could have significantly more complicated rules, even calling out to other contracts for additional information.
