import { GlobalOutlined } from "@ant-design/icons"
import { Button, Tooltip , Typography } from "antd"
import useSafeScan from "../../hooks/useSafeScan";

const { Link } = Typography;

export enum SafescanComponentType {
  Link = "Link" ,
  Button = "Button"
}

export default ( {
  url , type
} : {
  url : string ,
  type ?: SafescanComponentType
} ) => {
  const { URL , API } = useSafeScan();
  const click = () => window.open( `${URL}${url}` );
  return <>
    <Tooltip title="在浏览器上查看">
      {
        (! type || type == SafescanComponentType.Button) && <Button size="small" icon={<GlobalOutlined />} onClick={click}/>
      }
      {
        type == SafescanComponentType.Link && <Link onClick={click}><GlobalOutlined /></Link>
      }
    </Tooltip>
  </>

}
