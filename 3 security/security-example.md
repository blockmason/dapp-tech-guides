# Security and Authentication in Hybrid Dapps

This guide will show one method for implementing a private key/pubic key security system for a dapp that utilizes a server as an intermediary between clients and the Ethereum blockchain. We will be using the Blockmason dapp Lndr as an example of how one such implementation scheme can work. We will start at the client and then move to the server. Links to the relevant Lndr files will be included for reference. It is important to note that the following authentication scheme is specific to Blockmason's Credit Protocol and anything using Credit Protocol must follow this scheme.

## Client

The first step is to generate a private key using keccak256, which is used by Ethereum. The private key is stored on the user's mobile device and is stored in a SQLite database. When the user wants to initiate a credit transaction on Lndr, the client generates a message with the specified parameters (creditor address, debtor address, ucac address, amount, memo). This message is then passed into the "sign" function along with the user's private message (https://github.com/blockmason/lndr-mobile/blob/master/packages/credit-protocol/index.ts). The function looks like this:

```
sign(message, privateKeyBuffer) {
    if (typeof message === 'string') {
      message = stringToBuffer(message)
    }

    const { r, s, v } = ethUtil.ecsign(
      ethUtil.hashPersonalMessage(message),
      privateKeyBuffer
    )

    return bufferToHex(
      Buffer.concat(
        [ r, s, Buffer.from([ v ]) ]
      )
    )
}
```

The first 'if' statement should always pass, at which point three constants are generated using the ethUtil.ecsign method. The ecsign method takes in a hash of the message and the private key buffer and returns two buffers and one string: r, s, and v respectively. The first two, r and s, each are 32 bytes and composed of unicode characters while v is just a single byte. Lastly, the function concatenates these three items and encodes them as a single hex string with a size of 65 bytes (32 + 32 + 1). This final hex-encoded string now includes both the message for Credit Protocol and the signature of the user, and it is sent to the server when the user initiates a transaction.

## Server

When the server receives a signed message, it must verify that the signature comes from a private key that corresponds to a valid Ethereum address and that this address matches either the creditor or debtor address in the message. The message itself consists of the various components of the credit transaction for CP and the signature. The Lndr server code (in Haskell) is located here: https://github.com/blockmason/lndr. And here is an example of how the server would do this validation in JavaScript:

```
const incomingMessage = {
    signature: 'signature' //hex string of length 130
    creditRecord: {
        creditor: 'address' //Ethereum address of the creditor
        debtor: 'address' //Ethereum address of the debtor
        amount: 12345 //transaction amount
        memo: 'memo'
    }
}

const messageg = stringToBuffer(incomingMessage.creditRecord.creditor + incomingMessage.creditRecord.debtor + incomingMessage.creditRecord.amount)

const msgHash = ethUtil.hashPersonalMessage(msg)

const ret = ethUtil.fromRpcSig(signature)

const publicKey = ethUtil.ecrecover(msgHash, ret.v, ret.r, ret.s)

const addressBuffer = ethUtil.pubToAddress(publicKey)

const senderAddress = ethUtil.bufferToHex(addressBuffer)

if(senderAddress !== incomingMessage.creditRecord.creditor) {
    throw new Error('Invalid Creditor Address')
}

```

The first step is to generate a message that is of the same form as that used to generate the signature on the client. The message is hashed using the same ethUtil.hashPersonalMessage method, and then the three pieces of the signature are broken out using the fromRpcSig method. With these four pieces of information (the hashed message and the three parts of the signature), we can then derive the public key corresponding to the sender's private key using the ecrecover method. The newly derived public key can then be passed into the EthUtil pubToAddress method to get the Ethereum address that corresponds to the sender's private key. To recap, Signed Message > Public Key > Ethereum Address. At this point, the derived address can be compared with either of the addresses in the message itself to determine if the address of the signer matches the address of the debtor or creditor. Our server uses separate endpoints for creditor and debtor, so a message coming to the creditor endpoint must be signed by a private key corresponding to the same address as the creditor address in the CP transaction message. In the code above, we are assuming that the sender is the creditor in this particular transaction.

If the server has only received a transaction initiation, it will store the unconfirmed transaction in a PostgreSQL database until it receives a confirmation from the other party. Once the second party has confirmed the transaction, the message is hashed with both signatures is generated and then sent to the Credit Protocol contract for storage on the blockchain. The blockchain is used to only store completed contracts, reducing the gas expenditure while maintaining the core functionality of Lndr.

This is just a quick guide to how our implementation of CP for Lndr. If you have any questions please reach out to us about implementing Credit Protocol in your server language/framework and we will do our best to help!
