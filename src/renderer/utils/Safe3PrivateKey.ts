

import { ethers } from 'ethers';
import { base58, sha256 } from 'ethers/lib/utils';
const CryptoJS = require('crypto-js');

const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{52}$/;

const hexToUint8Bytes = (hex: string): Uint8Array => {
  let _hex = hex.indexOf("0x") == 0 ? hex.substring(2) : hex;
  const hexBytes = _hex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16));
  if (hexBytes) {
    return new Uint8Array(hexBytes);
  }
  return new Uint8Array();
}

const sha256Hex = (hex: string): string => {
  const bytes = hexToUint8Bytes(hex);
  return bytes ? sha256(bytes).substring(2) : "";
}

export const publicKeyToSafe3Address = (publicKey: string): string => {
  return publicKeyToAddress(publicKey, "4c");
}

/**
 * https://gobittest.appspot.com/Address
 * @param publicKey
 * @param networkFlag
 * @returns
 */
const publicKeyToAddress = (publicKey: string, networkFlag: string): string => {
  const sha1 = sha256Hex(publicKey)
  const wordArray = CryptoJS.enc.Hex.parse(sha1);
  const ripemd160 = CryptoJS.RIPEMD160(
    wordArray
  ).toString();
  const withNetwork = networkFlag + ripemd160;
  const twiceSha256Hash = sha256Hex(sha256Hex(withNetwork));
  const header = twiceSha256Hash.substring(0, 8);
  const beforeBase58 = withNetwork + header;
  return base58.encode(hexToUint8Bytes(beforeBase58));
}

const toCompressPublicKey = (publicKey: string) => {
  const _publicKey = publicKey.substring(2);
  const X = _publicKey.substring(0, 64);
  const Y = _publicKey.substring(64);
  const EndOfY = Y.substring(Y.length - 1);
  const condition = parseInt(EndOfY, 16) % 2 == 0;
  if (condition) {
    return "02" + X;
  }
  return "03" + X;
}

export async function generateRedeemSign(evmPrivateKey: string, safe3Address: string, targetSafe4Address: string) : Promise<string> {
  const wallet = new ethers.Wallet(evmPrivateKey);
  const safe3AddressBytes = ethers.utils.toUtf8Bytes(safe3Address);
  const safe4AddressBytes = ethers.utils.arrayify(targetSafe4Address);
  var mergedArray = new Uint8Array(safe3AddressBytes.length + safe4AddressBytes.length);
  mergedArray.set(safe3AddressBytes);
  mergedArray.set(safe4AddressBytes, safe3AddressBytes.length);
  const sha256Address = ethers.utils.sha256(mergedArray);
  const signMsg = await wallet.signMessage(ethers.utils.arrayify(sha256Address));
  return new Promise<string>(( resolve , reject ) => {
    resolve(signMsg);
  });
}

// Example in >> XJ2M1PbCAifB8W91hcHDEho18kA2ByB4Jdmi4XBHq5sNgtuEpXr4
export default (Safe3PrivateKey: string): {
  privateKey: string,
  publicKey: string,
  compressPublicKey: string,
  safe3Address: string,
  safe3CompressAddress: string,
  safe4Address: string
} => {

  let privateKey: string | undefined;
  if (base58Regex.test(Safe3PrivateKey)) {
    const privateKeyDecodeHex = ethers.utils.hexValue(base58.decode(Safe3PrivateKey));
    privateKey = privateKeyDecodeHex.substring(4, 68);
  } else {
    privateKey = Safe3PrivateKey;
  }
  const wallet = new ethers.Wallet(privateKey);
  const publicKey = wallet.publicKey.substring(2);
  const compressPublicKey = toCompressPublicKey(publicKey);
  const safe3Address = publicKeyToAddress(publicKey, "4c");
  const safe3CompressAddress = publicKeyToAddress(compressPublicKey, "4c");
  return {
    privateKey,
    publicKey,
    compressPublicKey,
    safe3Address,
    safe3CompressAddress,
    safe4Address: wallet.address
  }
}
