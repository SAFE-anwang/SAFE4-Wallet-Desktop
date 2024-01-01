import { Button, Col, Divider, Input, Modal, Row, Typography, Space } from "antd"
import { Children, useEffect, useMemo, useState } from "react";
import { useETHBalances, useWalletsActiveAccount, useWalletsActiveSigner } from "../../../state/wallets/hooks"
import { MemoryRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useBlockNumber } from "../../../state/application/hooks";
import { ethers } from "ethers";
import WalletSendModalInput from "./WalletSendModal-Input";
import WalletSendModalConfirm from "./WalletSendModal-Confirm";
const { Text } = Typography;

const STEP_INPUT = 0;
const STEP_CONFIRM = 1;

export default ({
    openSendModal,
    setOpenSendModal
}: {
    openSendModal: boolean,
    setOpenSendModal: (open: boolean) => void
}) => {
    const [step, setStep] = useState(STEP_INPUT);
    const [inputParams, setInputParams] = useState<{
        to: string,
        amount: string 
    }>({
        to: "",
        amount: ""
    });

    return <>
        <Modal footer={null} destroyOnClose title="发送" style={{ height: "300px" }} open={openSendModal} onCancel={() => {
            setInputParams({
                to : "" , 
                amount: ""
            });
            setStep(STEP_INPUT);
            setOpenSendModal(false);
        }}>
            <Divider />
            {
                step == STEP_INPUT && <WalletSendModalInput finishCallback={( {to , amount} )=>{
                    setInputParams( {
                        to , amount
                    });
                    setStep(STEP_CONFIRM);
                }}/>
            }
            {
                step == STEP_CONFIRM && <WalletSendModalConfirm { ...inputParams }  />
            }
        </Modal>
    </>

}