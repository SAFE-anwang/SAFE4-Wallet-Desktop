import { useState } from "react"
import AddLiquidity from "./AddLiquidity";


const enum AssetPoolModule {
  View = "View" ,
  Add  = "Add"  ,
  Remove = "Remove",
}


export default () => {
  const [assetPoolModule , setAssetPoolModule] = useState<AssetPoolModule>(AssetPoolModule.Add);
  return <>
    {
      assetPoolModule == AssetPoolModule.Add && <AddLiquidity />
    }
  </>

}
