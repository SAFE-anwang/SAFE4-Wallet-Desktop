
import IERC20 from "./IERC20.json";
import ISRC20 from "./ISRC20.json";
import INFT_721 from "./INFT_721.json";
import INFT_1155 from "./INFT_1155.json";
import { Interface } from "ethers/lib/utils";

export const IERC20_Interface = new Interface(JSON.stringify(IERC20));
export const ISRC20_Interface = new Interface(JSON.stringify(ISRC20));
export const INFT_721_Interface = new Interface(JSON.stringify(INFT_721));
export const INFT_1155_Interface = new Interface(JSON.stringify(INFT_1155));

