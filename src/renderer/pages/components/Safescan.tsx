import { GlobalOutlined } from "@ant-design/icons"
import { Button, Tooltip , Typography } from "antd"

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
  const click = () => window.open(url);
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
