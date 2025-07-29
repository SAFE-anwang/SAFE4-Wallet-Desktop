import { LockOutlined } from "@ant-design/icons";
import { Button, Card, Col, Divider, Modal, Row, Typography } from "antd"
import { useCallback, useState } from "react"
import useTransactionResponseRender from "../../../components/useTransactionResponseRender"
import { useTransactionAdder } from "../../../../state/transactions/hooks"
import { useWalletsActiveAccount } from "../../../../state/wallets/hooks"
import { useMasternodeLogicContract } from "../../../../hooks/useContracts"
import { Masternode_Create_Type_NoUnion, Masternode_create_type_Union } from "./MasternodeRegister";
import { ethers } from "ethers";
import { TransactionResponse } from "@ethersproject/providers";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { applicationUpdateWalletTab } from "../../../../state/application/action";
import { Safe4_Business_Config } from "../../../../config";
import { walletsUpdateUsedChildWalletAddress, walletsUpdateWalletChildWallets } from "../../../../state/wallets/action";
import { useTranslation } from "react-i18next";
import { useWeb3React } from "@web3-react/core";

const { Text } = Typography;

export default ({
  openRegisterModal, setOpenRegisterModal, registerParams
}: {
  openRegisterModal: boolean,
  setOpenRegisterModal: (openRegisterModal: boolean) => void,
  registerParams: {
    registerType: number,
    address: string | undefined,
    enode: string | undefined,
    description: string | undefined,
    incentivePlan: {
      creator: number,
      partner: number
    }
  }
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { registerType } = registerParams;
  const [sending, setSending] = useState<boolean>(false);
  const {
    render,
    setTransactionResponse,
    setErr
  } = useTransactionResponseRender();
  const addTransaction = useTransactionAdder();
  const activeAccount = useWalletsActiveAccount();
  const masternodeLogicContract = useMasternodeLogicContract(true);
  const { chainId, provider } = useWeb3React();

  const doRegisterMasternode = useCallback(async () => {
    if (activeAccount && masternodeLogicContract && chainId && provider) {
      const { registerType, enode, description, incentivePlan, address } = registerParams;
      // function register(bool _isUnion, address _addr, uint _lockDay, string memory _enode, string memory _description,
      //  uint _creatorIncentive, uint _partnerIncentive) external payable;
      //
      const value = ethers.utils.parseEther(
        Masternode_create_type_Union == registerType ? Safe4_Business_Config.Masternode.Create.UnionLockAmount + ""
          : Safe4_Business_Config.Masternode.Create.LockAmount + ""
      );
      if (registerType == Masternode_Create_Type_NoUnion) {
        incentivePlan.creator = 100;
        incentivePlan.partner = 0;
      }
      setSending(true);

      const data = masternodeLogicContract.interface.encodeFunctionData("register", [
        Masternode_create_type_Union == registerType,
        address,
        Safe4_Business_Config.Masternode.Create.LockDays,
        enode, description,
        incentivePlan.creator, incentivePlan.partner
      ]);
      const tx: ethers.providers.TransactionRequest = {
        to: masternodeLogicContract.address,
        data,
        value,
        chainId
      };
      const { signedTx, error } = await window.electron.wallet.signTransaction(
        activeAccount,
        provider.connection.url,
        tx
      );
      if (signedTx) {
        try {
          const response = await provider.sendTransaction(signedTx);
          const { hash, data } = response;
          setTransactionResponse(response);
          addTransaction({ to: masternodeLogicContract.address }, response, {
            call: {
              from: activeAccount,
              to: masternodeLogicContract.address,
              input: data,
              value: value.toString()
            }
          });
          dispatch(walletsUpdateUsedChildWalletAddress({
            address,
            used: true
          }));
          setTxHash(hash);
        } catch (err) {
          setErr(err)
        } finally {
          setSending(false);
        }
      }
      if (error) {
        setSending(false);
        setErr(error)
      }
    }
  }, [activeAccount, masternodeLogicContract, registerParams]);

  const [txHash, setTxHash] = useState<string>();
  const cancel = useCallback(() => {
    setOpenRegisterModal(false);
    if (txHash) {
      setTxHash(undefined);
      dispatch(applicationUpdateWalletTab("history"));
      navigate("/main/wallet");
    }
  }, [txHash]);

  return <Modal title={t("wallet_masternodes_create")} open={openRegisterModal} footer={null} destroyOnClose onCancel={cancel}>
    <Divider />
    {
      render
    }
    <Row>
      <Col span={24}>
        <LockOutlined style={{ fontSize: "32px" }} />
        {
          registerType == Masternode_Create_Type_NoUnion &&
          <Text strong style={{ fontSize: "32px", marginLeft: "5px" }}>1,000 SAFE</Text>
        }
        {
          registerType == Masternode_create_type_Union &&
          <Text strong style={{ fontSize: "32px", marginLeft: "5px" }}>200 SAFE</Text>
        }
      </Col>
    </Row>
    <br />
    <Row>
      <Col span={24}>
        <Text type="secondary">{t("wallet_send_from")}</Text>
      </Col>
      <Col span={24} style={{ paddingLeft: "5px" }} >
        <Text>{t("wallet_account_normal")}</Text>
      </Col>
    </Row>
    <br />
    <Row>
      <Col span={24}>
        <Text type="secondary">{t("wallet_send_to")}</Text>
      </Col>
      <Col span={24} style={{ paddingLeft: "5px" }} >
        <Text>{t("wallet_account_locked")}</Text>
      </Col>
    </Row>
    <Divider />
    <Card size="small">
      <Row>
        <Col span={24}>
          <Text type="secondary">{t("wallet_masternodes_enode")}</Text>
        </Col>
        <Col span={24}>
          <Text>{registerParams.enode}</Text>
        </Col>
        <Divider style={{ margin: "8px 0px" }} />
      </Row>
      <Row>
        <Col span={24}>
          <Text type="secondary">{t("wallet_masternodes_description")}</Text>
        </Col>
        <Col span={24}>
          <Text>{registerParams.description}</Text>
        </Col>
      </Row>
    </Card>
    <Divider />
    <Row style={{ width: "100%", textAlign: "right" }}>
      <Col span={24}>
        {
          !sending && !render && <Button onClick={() => {
            doRegisterMasternode();
          }} disabled={sending} type="primary" style={{ float: "right" }}>
            {t("wallet_send_status_broadcast")}
          </Button>
        }
        {
          sending && !render && <Button loading disabled type="primary" style={{ float: "right" }}>
            {t("wallet_send_status_sending")}
          </Button>
        }
        {
          render && <Button onClick={cancel} type="primary" style={{ float: "right" }}>
            {t("wallet_send_status_close")}
          </Button>
        }
      </Col>
    </Row>

  </Modal>

}
