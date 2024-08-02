
import IERC20 from "./IERC20.json";
import { Interface } from "ethers/lib/utils";

export const IERC20_Interface = new Interface( JSON.stringify( IERC20 ) );
