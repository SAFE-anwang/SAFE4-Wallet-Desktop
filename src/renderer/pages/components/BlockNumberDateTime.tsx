import { useMemo } from "react";
import { useBlockNumber, useTimestamp } from "../../state/application/hooks"
import { DateTimeFormat } from "../../utils/DateUtils";


export default (blockNumber: number) => {

    const latestBlockNumber = useBlockNumber();
    const latestTimestamp = useTimestamp();
    const datetimeRender = useMemo( () => {
        // if (blockNumber - latestBlockNumber > 0){
        //     return <>
        //         {DateTimeFormat(((blockNumber - latestBlockNumber) * 30 + latestTimestamp) * 1000)}
        //     </>
        // }
        return <></>
    } , [ blockNumber , latestBlockNumber, latestTimestamp ] )

    return <></>;
}