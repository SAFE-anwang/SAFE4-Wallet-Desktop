
import IERC20 from "./IERC20.json";
import ISRC20 from "./ISRC20.json";
import { Interface } from "ethers/lib/utils";

export const IERC20_Interface = new Interface( JSON.stringify( IERC20 ) );
export const ISRC20_Interface = new Interface( JSON.stringify(ISRC20) );
