import { useEffect } from "react"


export default ({
  successCallback, failedCallback , i
}: {
  successCallback: () => void,
  failedCallback: () => void,
  i : number
}) => {

  useEffect( () => {
    console.log("execute .... for :" , i)
  } , [] );

  return <>
    {i}
  </>

}
