import { useSelector } from "react-redux"
import { AppState } from "../../../state"


export default () => {

    const data = useSelector<AppState , { [key : string] : any }>(state => state.application.data);

    return (<>
        Menu ...    <br />
        {
            Object.keys(data).map( key => {
                return <>
                    { key } = { JSON.stringify(data[key]) } <br /><br />
                </>
            })
        }

    </>)

}
