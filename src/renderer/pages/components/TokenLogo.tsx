

import { Image } from "antd"
import SAFE_LOGO from "../../assets/logo/SAFE.png"

export default ({
  width, height
}: {
  width?: number | string,
  height?: number | string
}) => {

  return <Image preview={false}
    width={width ? width : "30px"}
    height={height ? height : "30px"}
    src={SAFE_LOGO}
  />

}
