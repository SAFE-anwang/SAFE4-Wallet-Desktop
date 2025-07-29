import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWalletsList } from "../../state/wallets/hooks";

export default () => {
  const navigate = useNavigate();
  const wallets = useWalletsList();
  useEffect(() => {
    if (wallets.length == 0) {
      navigate("/selectCreateWallet");
    } else {
      navigate("/main/wallet")
    }
  }, [wallets]);
  return <>

  </>
}
