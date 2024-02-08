const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;
const secp = require('ethereum-cryptography/secp256k1');
const {keccak256} = require('ethereum-cryptography/keccak');

app.use(cors());
app.use(express.json());

// public keys
const balances = {
  "d7e5c97b15c84a6112e0101dd18a95651b611c2e5ce060e97c3a45771a4049e8": 100,
  "c1105efeac968c351728e08648e7b4348f33af106a7d37c5dfafd68bf6eb5d2b": 50,
  "cb0ed3a7458c1cee82a1a70b7124c1482eceb7c2288ed5e2533bf1c549686825": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { sender, sig:sigStringed, msg } = req.body;
  const { recipient, amount } = msg;

  // convert stringified bigints back to bigints
  const sig = {
    ...sigStringed,
    r: BigInt(sigStringed.r),
    s: BigInt(sigStringed.s)
  }

  const hashMessage = (message) => keccak256(Uint8Array.from(message));

  const isValid = secp.secp256k1.verify(sig, hashMessage(msg), sender) === true;
  
  if(!isValid) res.status(400).send({ message: "Bad signature!"});

  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
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
