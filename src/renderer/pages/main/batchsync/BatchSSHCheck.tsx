import { useEffect, useMemo } from "react";
import { SSH2ConnectConfig } from "../../../../main/SSH2Ipc"
import { useBatchSSHCheck } from "../../../hooks/useBatchSSHCheck";
import { Button } from "antd";

const sshconfigs: SSH2ConnectConfig[] = [
  {
    host: "47.119.151.64",
    username: "root",
    password: "Zy654321!",
    port: 22
  },
  {
    host: "39.108.69.183",
    username: "root",
    password: "Zy654321!",
    port: 22
  }
];


export default () => {

  const { results , start } = useBatchSSHCheck( sshconfigs );

  return <>

    <Button onClick={start}>Check...</Button>

    {JSON.stringify(results)}

  </>

}
