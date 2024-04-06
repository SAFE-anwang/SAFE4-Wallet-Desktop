import { useEffect } from "react";
import { useWalletsActivePrivateKey, useWalletsActiveSigner, useWalletsActiveWallet } from "../../../state/wallets/hooks";
import { ethers } from "ethers";
const CryptoJS = require('crypto-js');


export default () => {

  useEffect(() => {

    // 定义密码和待加密的数据
    const password = 'MySecretPassword123'; // 密码
    const dataToEncrypt = 'Hello, world!';   // 待加密的数据

    const salt = CryptoJS.lib.WordArray.random(32);
    // 使用 PBKDF2 派生密钥
    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 1024 ,
      hasher: CryptoJS.algo.SHA256
    });
    const iv = CryptoJS.lib.WordArray.random(16);

    // AES 加密
    const encrypt = CryptoJS.AES.encrypt(dataToEncrypt, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
    const ciphertext = encrypt.ciphertext.toString(CryptoJS.enc.Hex);
    console.log("ciphertext:" , ciphertext)

    // console.log(CryptoJS.AES.encrypt)
    // // AES 解密
    const decryptedData = CryptoJS.AES.decrypt( 
      { ciphertext : CryptoJS.enc.Hex.parse(ciphertext) } , 
      key, 
      { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
    );

    console.log('Decrypted Data:', decryptedData.toString(CryptoJS.enc.Utf8));


    // console.log(signer);
    // if (signer) {
    //   signer.encrypt("123456").then((keystore) => {
    //     console.log('Keystore:', keystore);
    //   }).catch((error) => {
    //     console.error('Error:', error);
    //   });
    // }
  }, []);



  return <>

  </>
}
