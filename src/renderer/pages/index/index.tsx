import { Button, Card, Col, Input, Row, Spin, Typography } from "antd"
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IPC_CHANNEL } from "../../config";
import { IndexSingal, Index_Methods } from "../../../main/handlers/IndexSingalHandler";
import { useDispatch } from "react-redux";
import { walletsLoadKeystores } from "../../state/wallets/action";
import { applicationDataLoaded, applicationSetPassword } from "../../state/application/action";
import { useWalletsKeystores } from "../../state/wallets/hooks";
const CryptoJS = require('crypto-js');

const { Text } = Typography;

export default () => {
  const navigate = useNavigate();
  const walletsKeystores = useWalletsKeystores();
  useEffect( () => {
    if ( walletsKeystores.length == 0) {
      navigate("/selectCreateWallet");
    } else {
      navigate("/main/wallet")
    }
  } , [walletsKeystores] );
  return <>

  </>
}
