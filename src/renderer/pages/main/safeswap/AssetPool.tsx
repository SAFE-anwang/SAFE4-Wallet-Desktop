import { Pair } from "@uniswap/sdk";
import { useState } from "react"
import AddLiquidity from "./AddLiquidity";
import { SafeswapV2Pairs } from "./hooks";
import PoolList from "./PoolList";
import RemoveLiquidity from "./RemoveLiquidity";
import { useTranslation } from "react-i18next";

export enum AssetPoolModule {
  List = "List",
  Add = "Add",
  Remove = "Remove",
}

export default ({
  _assetPoolModule,
  safeswapV2Pairs
}: {
  _assetPoolModule?: AssetPoolModule,
  safeswapV2Pairs: SafeswapV2Pairs
}) => {
  const [assetPoolModule, setAssetPoolModule] = useState<AssetPoolModule>(_assetPoolModule ? _assetPoolModule : AssetPoolModule.Remove);
  return <>
    {
      assetPoolModule == AssetPoolModule.Add && <AddLiquidity safeswapV2Pairs={safeswapV2Pairs} setAssetPoolModule={setAssetPoolModule} />
    }
    {
      assetPoolModule == AssetPoolModule.List && <PoolList safeswapV2Pairs={safeswapV2Pairs} setAssetPoolModule={setAssetPoolModule} />
    }
    {
      assetPoolModule == AssetPoolModule.Remove && <RemoveLiquidity safeswapV2Pairs={safeswapV2Pairs} setAssetPoolModule={setAssetPoolModule} />
    }
  </>

}
