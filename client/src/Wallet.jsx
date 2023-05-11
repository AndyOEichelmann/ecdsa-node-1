import server from "./server";
import * as secp from "ethereum-cryptography/secp256k1";
import { keccak256 } from "ethereum-cryptography/keccak";
import { toHex, utf8ToBytes } from "ethereum-cryptography/utils";

function Wallet({ balance, setBalance, address, setAddress, privateKey,  setPrivateKey, setSignature}) {

  async function onChange(evt) {

    const privateKey = evt.target.value;
    setPrivateKey(privateKey);

    // Obtain the publick key from private key
    const publicKey = secp.secp256k1.getPublicKey(privateKey);

    // Obtain the addres
    const firstByteKey = publicKey.slice(1);
    const keyHash = keccak256(firstByteKey);
    const address = toHex(keyHash.slice(keyHash.length - 20));
    setAddress(address);

    // Generate signature
    const msgHash = keccak256(utf8ToBytes(`${address} accept to transfer`));
    const signature = secp.secp256k1.sign(msgHash, privateKey);
    setSignature(signature);

    if (address) {
      const {
        data: { balance },
      } = await server.get(`balance/${address}`);
      setBalance(balance);
    } else {
      setBalance(0);
    }
  }

  return (
    <div className="container wallet">
      <h1>Your Wallet</h1>

      <label>
        Private Key
        <input placeholder="Type an private key: " value={privateKey} onChange={onChange}></input>
      </label>

      <div>Adress: {address}</div>

      <div className="balance">Balance: {balance}</div>
    </div>
  );
}

export default Wallet;
