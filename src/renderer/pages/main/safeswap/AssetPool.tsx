import { useState } from "react"
import AddLiquidity from "./AddLiquidity";
import PoolList from "./PoolList";


export enum AssetPoolModule {
  List = "List" ,
  Add  = "Add"  ,
  Remove = "Remove",
}

export default () => {
  const [assetPoolModule , setAssetPoolModule] = useState<AssetPoolModule>(AssetPoolModule.List);
  return <>
    {
      assetPoolModule == AssetPoolModule.Add && <AddLiquidity />
    }
    {
      assetPoolModule == AssetPoolModule.List && <PoolList setAssetPoolModule={setAssetPoolModule} />
    }
  </>

}
