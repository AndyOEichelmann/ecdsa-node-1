const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;

const { secp256k1 } = require("ethereum-cryptography/secp256k1");
const { keccak256 } = require("ethereum-cryptography/keccak");
const { toHex, utf8ToBytes} = require("ethereum-cryptography/utils");

app.use(cors());
app.use(express.json());

const balances = {
  "cb397109a7a9404038437cc7ab443dc191feefcf": 100, // acount 1
  "0a2e8f8490166f7f53b4667ad7ab2e256c3e9b4c": 50,  // acount 2
  "2a291bb0d7f52e4e9231aa81cb30ec821be48f7c": 75,  // acount 3
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { sender, recipient, amount, signature } = req.body;

  // Recover signature
  const sig = new secp256k1.Signature(BigInt(signature.r), BigInt(signature.s), parseInt(signature.recovery));
  // recover publick key
  const msgHash = keccak256(utf8ToBytes(`${sender} accept to transfer`));
  const recoverKey = sig.recoverPublicKey(msgHash);
  const publicKey = recoverKey.toRawBytes();
  // verify signature and obtain signer address
  const verifySig = secp256k1.verify(sig, msgHash, publicKey);
  const sigAddress = verifySignature(verifySig, publicKey);

  // comper sender to signer address
  if(sigAddress !== sender){
    res.status(400).send({ message: "Only owner is allowed to transfer!" });
  } else {
    setInitialBalance(sender);
    setInitialBalance(recipient);
  
    if (balances[sender] < amount) {
      res.status(400).send({ message: "Not enough funds!" });
    } else {
      balances[sender] -= amount;
      balances[recipient] += amount;
      res.send({ balance: balances[sender] });
    }
  }

});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}

// verification function, returns : signer address
function verifySignature(verify, publicKey){
  if(verify === true){
    const firstByteKey = publicKey.slice(1);
    const keyHash = keccak256(firstByteKey);
    return toHex(keyHash.slice(keyHash.length - 20));
  }
}