import { useEffect } from "react";
import { SSH2ConnectConfig } from "../../../../main/SSH2Ipc"

const sshconfigs: SSH2ConnectConfig[] = [
  {
    host: "47.119.151.64",
    username: "root",
    password: "Zy654321!",
    port: 22
  },
  {
    host: "139.108.69.183",
    username: "root",
    password: "Zy654321!",
    port: 22
  }
];

export default () => {



  useEffect( () => {
    sshconfigs.forEach( sshConfig => {
      // window.electron.sshs.connect( sshConfig.host , sshConfig.port , sshConfig.username , sshConfig.password )
      //   .then( data => {
      //     console.log("host << " , data) ;
      //     window.electron.sshs.close( sshConfig.host );
      //   } )
      //   .catch( err => {
      //     console.log("sshs-connect-error:" , err)
      //   } )
    } )
  } , [] );

  return <>

  </>

}
