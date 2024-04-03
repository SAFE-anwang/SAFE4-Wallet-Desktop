import { useEffect } from "react";
import { useWalletsActivePrivateKey, useWalletsActiveSigner, useWalletsActiveWallet } from "../../../state/wallets/hooks";
import { ethers } from "ethers";
const CryptoJS = require('crypto-js');


export default () => {

  const privateKey = useWalletsActivePrivateKey();

  useEffect(() => {
    // 定义密码和待加密的数据
    const password = 'MySecretPassword123'; // 密码
    const dataToEncrypt = 'Hello, world!';   // 待加密的数据
    // 使用 PBKDF2 派生密钥
    const key = CryptoJS.PBKDF2(password, 'safe4.wallet.salt', {
      keySize: 256 / 32,
      iterations: 1000 ,
      hasher: CryptoJS.algo.SHA256
    });
    console.log("key :>>" , key.toString())
    // const key = CryptoJS.enc.Utf8.parse("936afc503717c78da8e705246dcbac7492725b799fae80a0305dcd0d076ca507");  //十六位十六进制数作为密钥
    const iv = CryptoJS.lib.WordArray.random(16);
    // AES 加密
    const encryptedData = CryptoJS.AES.encrypt(dataToEncrypt, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
    console.log('Encrypted Data:', encryptedData.toString());
    // console.log(CryptoJS.AES.encrypt)
    // // AES 解密
    const decryptedData = CryptoJS.AES.decrypt(encryptedData, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
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
