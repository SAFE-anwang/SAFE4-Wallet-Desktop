
import { LeftOutlined } from '@ant-design/icons';
import { Typography, Button, Card, Divider, Statistic, Row, Col, Modal, Flex, Tooltip, Tabs, TabsProps, QRCode, Badge, Space, Alert, Table, Spin, Input } from 'antd';
import { FunctionFragment, Interface } from 'ethers/lib/utils';
import { RefObject, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContractConstructor from './ContractConstructor';
import { ethers } from 'ethers';
import { useWalletsActiveSigner } from '../../../state/wallets/hooks';
import { TransactionResponse } from '@ethersproject/providers';
import config from '../../../config';

const { Title, Text, Link } = Typography;

const _ABI = "[{\"inputs\": [ 			{ 				\"internalType\": \"address\", 				\"name\": \"initialOwner\", 				\"type\": \"address\" 			}, 			{ 				\"internalType\": \"string\", 				\"name\": \"uri_\", 				\"type\": \"string\" 			}, 			{ 				\"internalType\": \"string\", 				\"name\": \"name_\", 				\"type\": \"string\" 			}, 			{ 				\"internalType\": \"string\", 				\"name\": \"symbol_\", 				\"type\": \"string\" 			} 		], 		\"stateMutability\": \"nonpayable\", 		\"type\": \"constructor\" 	}, 	{ 		\"inputs\": [ 			{ 				\"internalType\": \"address\", 				\"name\": \"sender\", 				\"type\": \"address\" 			}, 			{ 				\"internalType\": \"uint256\", 				\"name\": \"balance\", 				\"type\": \"uint256\" 			}, 			{ 				\"internalType\": \"uint256\", 				\"name\": \"needed\", 				\"type\": \"uint256\" 			}, 			{ 				\"internalType\": \"uint256\", 				\"name\": \"tokenId\", 				\"type\": \"uint256\" 			} 		], 		\"name\": \"ERC1155InsufficientBalance\", 		\"type\": \"error\" 	}, 	{ 		\"inputs\": [ 			{ 				\"internalType\": \"address\", 				\"name\": \"approver\", 				\"type\": \"address\" 			} 		], 		\"name\": \"ERC1155InvalidApprover\", 		\"type\": \"error\" 	}, 	{ 		\"inputs\": [ 			{ 				\"internalType\": \"uint256\", 				\"name\": \"idsLength\", 				\"type\": \"uint256\" 			}, 			{ 				\"internalType\": \"uint256\", 				\"name\": \"valuesLength\", 				\"type\": \"uint256\" 			} 		], 		\"name\": \"ERC1155InvalidArrayLength\", 		\"type\": \"error\" 	}, 	{ 		\"inputs\": [ 			{ 				\"internalType\": \"address\", 				\"name\": \"operator\", 				\"type\": \"address\" 			} 		], 		\"name\": \"ERC1155InvalidOperator\", 		\"type\": \"error\" 	}, 	{ 		\"inputs\": [ 			{ 				\"internalType\": \"address\", 				\"name\": \"receiver\", 				\"type\": \"address\" 			} 		], 		\"name\": \"ERC1155InvalidReceiver\", 		\"type\": \"error\" 	}, 	{ 		\"inputs\": [ 			{ 				\"internalType\": \"address\", 				\"name\": \"sender\", 				\"type\": \"address\" 			} 		], 		\"name\": \"ERC1155InvalidSender\", 		\"type\": \"error\" 	}, 	{ 		\"inputs\": [ 			{ 				\"internalType\": \"address\", 				\"name\": \"operator\", 				\"type\": \"address\" 			}, 			{ 				\"internalType\": \"address\", 				\"name\": \"owner\", 				\"type\": \"address\" 			} 		], 		\"name\": \"ERC1155MissingApprovalForAll\", 		\"type\": \"error\" 	}, 	{ 		\"inputs\": [], 		\"name\": \"EnforcedPause\", 		\"type\": \"error\" 	}, 	{ 		\"inputs\": [], 		\"name\": \"ExpectedPause\", 		\"type\": \"error\" 	}, 	{ 		\"inputs\": [ 			{ 				\"internalType\": \"address\", 				\"name\": \"owner\", 				\"type\": \"address\" 			} 		], 		\"name\": \"OwnableInvalidOwner\", 		\"type\": \"error\" 	}, 	{ 		\"inputs\": [ 			{ 				\"internalType\": \"address\", 				\"name\": \"account\", 				\"type\": \"address\" 			} 		], 		\"name\": \"OwnableUnauthorizedAccount\", 		\"type\": \"error\" 	}, 	{ 		\"anonymous\": false, 		\"inputs\": [ 			{ 				\"indexed\": true, 				\"internalType\": \"address\", 				\"name\": \"account\", 				\"type\": \"address\" 			}, 			{ 				\"indexed\": true, 				\"internalType\": \"address\", 				\"name\": \"operator\", 				\"type\": \"address\" 			}, 			{ 				\"indexed\": false, 				\"internalType\": \"bool\", 				\"name\": \"approved\", 				\"type\": \"bool\" 			} 		], 		\"name\": \"ApprovalForAll\", 		\"type\": \"event\" 	}, 	{ 		\"anonymous\": false, 		\"inputs\": [ 			{ 				\"indexed\": true, 				\"internalType\": \"address\", 				\"name\": \"previousOwner\", 				\"type\": \"address\" 			}, 			{ 				\"indexed\": true, 				\"internalType\": \"address\", 				\"name\": \"newOwner\", 				\"type\": \"address\" 			} 		], 		\"name\": \"OwnershipTransferred\", 		\"type\": \"event\" 	}, 	{ 		\"anonymous\": false, 		\"inputs\": [ 			{ 				\"indexed\": false, 				\"internalType\": \"address\", 				\"name\": \"account\", 				\"type\": \"address\" 			} 		], 		\"name\": \"Paused\", 		\"type\": \"event\" 	}, 	{ 		\"anonymous\": false, 		\"inputs\": [ 			{ 				\"indexed\": true, 				\"internalType\": \"address\", 				\"name\": \"operator\", 				\"type\": \"address\" 			}, 			{ 				\"indexed\": true, 				\"internalType\": \"address\", 				\"name\": \"from\", 				\"type\": \"address\" 			}, 			{ 				\"indexed\": true, 				\"internalType\": \"address\", 				\"name\": \"to\", 				\"type\": \"address\" 			}, 			{ 				\"indexed\": false, 				\"internalType\": \"uint256[]\", 				\"name\": \"ids\", 				\"type\": \"uint256[]\" 			}, 			{ 				\"indexed\": false, 				\"internalType\": \"uint256[]\", 				\"name\": \"values\", 				\"type\": \"uint256[]\" 			} 		], 		\"name\": \"TransferBatch\", 		\"type\": \"event\" 	}, 	{ 		\"anonymous\": false, 		\"inputs\": [ 			{ 				\"indexed\": true, 				\"internalType\": \"address\", 				\"name\": \"operator\", 				\"type\": \"address\" 			}, 			{ 				\"indexed\": true, 				\"internalType\": \"address\", 				\"name\": \"from\", 				\"type\": \"address\" 			}, 			{ 				\"indexed\": true, 				\"internalType\": \"address\", 				\"name\": \"to\", 				\"type\": \"address\" 			}, 			{ 				\"indexed\": false, 				\"internalType\": \"uint256\", 				\"name\": \"id\", 				\"type\": \"uint256\" 			}, 			{ 				\"indexed\": false, 				\"internalType\": \"uint256\", 				\"name\": \"value\", 				\"type\": \"uint256\" 			} 		], 		\"name\": \"TransferSingle\", 		\"type\": \"event\" 	}, 	{ 		\"anonymous\": false, 		\"inputs\": [ 			{ 				\"indexed\": false, 				\"internalType\": \"string\", 				\"name\": \"value\", 				\"type\": \"string\" 			}, 			{ 				\"indexed\": true, 				\"internalType\": \"uint256\", 				\"name\": \"id\", 				\"type\": \"uint256\" 			} 		], 		\"name\": \"URI\", 		\"type\": \"event\" 	}, 	{ 		\"anonymous\": false, 		\"inputs\": [ 			{ 				\"indexed\": false, 				\"internalType\": \"address\", 				\"name\": \"account\", 				\"type\": \"address\" 			} 		], 		\"name\": \"Unpaused\", 		\"type\": \"event\" 	}, 	{ 		\"inputs\": [ 			{ 				\"internalType\": \"address\", 				\"name\": \"account\", 				\"type\": \"address\" 			}, 			{ 				\"internalType\": \"uint256\", 				\"name\": \"id\", 				\"type\": \"uint256\" 			} 		], 		\"name\": \"balanceOf\", 		\"outputs\": [ 			{ 				\"internalType\": \"uint256\", 				\"name\": \"\", 				\"type\": \"uint256\" 			} 		], 		\"stateMutability\": \"view\", 		\"type\": \"function\" 	}, 	{ 		\"inputs\": [ 			{ 				\"internalType\": \"address[]\", 				\"name\": \"accounts\", 				\"type\": \"address[]\" 			}, 			{ 				\"internalType\": \"uint256[]\", 				\"name\": \"ids\", 				\"type\": \"uint256[]\" 			} 		], 		\"name\": \"balanceOfBatch\", 		\"outputs\": [ 			{ 				\"internalType\": \"uint256[]\", 				\"name\": \"\", 				\"type\": \"uint256[]\" 			} 		], 		\"stateMutability\": \"view\", 		\"type\": \"function\" 	}, 	{ 		\"inputs\": [ 			{ 				\"internalType\": \"address\", 				\"name\": \"account\", 				\"type\": \"address\" 			}, 			{ 				\"internalType\": \"uint256\", 				\"name\": \"id\", 				\"type\": \"uint256\" 			}, 			{ 				\"internalType\": \"uint256\", 				\"name\": \"value\", 				\"type\": \"uint256\" 			} 		], 		\"name\": \"burn\", 		\"outputs\": [], 		\"stateMutability\": \"nonpayable\", 		\"type\": \"function\" 	}, 	{ 		\"inputs\": [ 			{ 				\"internalType\": \"address\", 				\"name\": \"account\", 				\"type\": \"address\" 			}, 			{ 				\"internalType\": \"uint256[]\", 				\"name\": \"ids\", 				\"type\": \"uint256[]\" 			}, 			{ 				\"internalType\": \"uint256[]\", 				\"name\": \"values\", 				\"type\": \"uint256[]\" 			} 		], 		\"name\": \"burnBatch\", 		\"outputs\": [], 		\"stateMutability\": \"nonpayable\", 		\"type\": \"function\" 	}, 	{ 		\"inputs\": [ 			{ 				\"internalType\": \"address\", 				\"name\": \"account\", 				\"type\": \"address\" 			}, 			{ 				\"internalType\": \"address\", 				\"name\": \"operator\", 				\"type\": \"address\" 			} 		], 		\"name\": \"isApprovedForAll\", 		\"outputs\": [ 			{ 				\"internalType\": \"bool\", 				\"name\": \"\", 				\"type\": \"bool\" 			} 		], 		\"stateMutability\": \"view\", 		\"type\": \"function\" 	}, 	{ 		\"inputs\": [ 			{ 				\"internalType\": \"address\", 				\"name\": \"account\", 				\"type\": \"address\" 			}, 			{ 				\"internalType\": \"uint256\", 				\"name\": \"id\", 				\"type\": \"uint256\" 			}, 			{ 				\"internalType\": \"uint256\", 				\"name\": \"amount\", 				\"type\": \"uint256\" 			}, 			{ 				\"internalType\": \"bytes\", 				\"name\": \"data\", 				\"type\": \"bytes\" 			} 		], 		\"name\": \"mint\", 		\"outputs\": [], 		\"stateMutability\": \"nonpayable\", 		\"type\": \"function\" 	}, 	{ 		\"inputs\": [ 			{ 				\"internalType\": \"address\", 				\"name\": \"to\", 				\"type\": \"address\" 			}, 			{ 				\"internalType\": \"uint256[]\", 				\"name\": \"ids\", 				\"type\": \"uint256[]\" 			}, 			{ 				\"internalType\": \"uint256[]\", 				\"name\": \"amounts\", 				\"type\": \"uint256[]\" 			}, 			{ 				\"internalType\": \"bytes\", 				\"name\": \"data\", 				\"type\": \"bytes\" 			} 		], 		\"name\": \"mintBatch\", 		\"outputs\": [], 		\"stateMutability\": \"nonpayable\", 		\"type\": \"function\" 	}, 	{ 		\"inputs\": [], 		\"name\": \"name\", 		\"outputs\": [ 			{ 				\"internalType\": \"string\", 				\"name\": \"\", 				\"type\": \"string\" 			} 		], 		\"stateMutability\": \"view\", 		\"type\": \"function\" 	}, 	{ 		\"inputs\": [], 		\"name\": \"owner\", 		\"outputs\": [ 			{ 				\"internalType\": \"address\", 				\"name\": \"\", 				\"type\": \"address\" 			} 		], 		\"stateMutability\": \"view\", 		\"type\": \"function\" 	}, 	{ 		\"inputs\": [], 		\"name\": \"pause\", 		\"outputs\": [], 		\"stateMutability\": \"nonpayable\", 		\"type\": \"function\" 	}, 	{ 		\"inputs\": [], 		\"name\": \"paused\", 		\"outputs\": [ 			{ 				\"internalType\": \"bool\", 				\"name\": \"\", 				\"type\": \"bool\" 			} 		], 		\"stateMutability\": \"view\", 		\"type\": \"function\" 	}, 	{ 		\"inputs\": [], 		\"name\": \"renounceOwnership\", 		\"outputs\": [], 		\"stateMutability\": \"nonpayable\", 		\"type\": \"function\" 	}, 	{ 		\"inputs\": [ 			{ 				\"internalType\": \"address\", 				\"name\": \"from\", 				\"type\": \"address\" 			}, 			{ 				\"internalType\": \"address\", 				\"name\": \"to\", 				\"type\": \"address\" 			}, 			{ 				\"internalType\": \"uint256[]\", 				\"name\": \"ids\", 				\"type\": \"uint256[]\" 			}, 			{ 				\"internalType\": \"uint256[]\", 				\"name\": \"values\", 				\"type\": \"uint256[]\" 			}, 			{ 				\"internalType\": \"bytes\", 				\"name\": \"data\", 				\"type\": \"bytes\" 			} 		], 		\"name\": \"safeBatchTransferFrom\", 		\"outputs\": [], 		\"stateMutability\": \"nonpayable\", 		\"type\": \"function\" 	}, 	{ 		\"inputs\": [ 			{ 				\"internalType\": \"address\", 				\"name\": \"from\", 				\"type\": \"address\" 			}, 			{ 				\"internalType\": \"address\", 				\"name\": \"to\", 				\"type\": \"address\" 			}, 			{ 				\"internalType\": \"uint256\", 				\"name\": \"id\", 				\"type\": \"uint256\" 			}, 			{ 				\"internalType\": \"uint256\", 				\"name\": \"value\", 				\"type\": \"uint256\" 			}, 			{ 				\"internalType\": \"bytes\", 				\"name\": \"data\", 				\"type\": \"bytes\" 			} 		], 		\"name\": \"safeTransferFrom\", 		\"outputs\": [], 		\"stateMutability\": \"nonpayable\", 		\"type\": \"function\" 	}, 	{ 		\"inputs\": [ 			{ 				\"internalType\": \"address\", 				\"name\": \"operator\", 				\"type\": \"address\" 			}, 			{ 				\"internalType\": \"bool\", 				\"name\": \"approved\", 				\"type\": \"bool\" 			} 		], 		\"name\": \"setApprovalForAll\", 		\"outputs\": [], 		\"stateMutability\": \"nonpayable\", 		\"type\": \"function\" 	}, 	{ 		\"inputs\": [ 			{ 				\"internalType\": \"string\", 				\"name\": \"newuri\", 				\"type\": \"string\" 			} 		], 		\"name\": \"setURI\", 		\"outputs\": [], 		\"stateMutability\": \"nonpayable\", 		\"type\": \"function\" 	}, 	{ 		\"inputs\": [ 			{ 				\"internalType\": \"bytes4\", 				\"name\": \"interfaceId\", 				\"type\": \"bytes4\" 			} 		], 		\"name\": \"supportsInterface\", 		\"outputs\": [ 			{ 				\"internalType\": \"bool\", 				\"name\": \"\", 				\"type\": \"bool\" 			} 		], 		\"stateMutability\": \"view\", 		\"type\": \"function\" 	}, 	{ 		\"inputs\": [], 		\"name\": \"symbol\", 		\"outputs\": [ 			{ 				\"internalType\": \"string\", 				\"name\": \"\", 				\"type\": \"string\" 			} 		], 		\"stateMutability\": \"view\", 		\"type\": \"function\" 	}, 	{ 		\"inputs\": [ 			{ 				\"internalType\": \"address\", 				\"name\": \"newOwner\", 				\"type\": \"address\" 			} 		], 		\"name\": \"transferOwnership\", 		\"outputs\": [], 		\"stateMutability\": \"nonpayable\", 		\"type\": \"function\" 	}, 	{ 		\"inputs\": [], 		\"name\": \"unpause\", 		\"outputs\": [], 		\"stateMutability\": \"nonpayable\", 		\"type\": \"function\" 	}, 	{ 		\"inputs\": [ 			{ 				\"internalType\": \"uint256\", 				\"name\": \"tokenId\", 				\"type\": \"uint256\" 			} 		], 		\"name\": \"uri\", 		\"outputs\": [ 			{ 				\"internalType\": \"string\", 				\"name\": \"\", 				\"type\": \"string\" 			} 		], 		\"stateMutability\": \"view\", 		\"type\": \"function\" 	} ]"

const _BYTECODE = "60806040523480156200001157600080fd5b5060405162001f9f38038062001f9f8339810160408190526200003491620001db565b83836200004181620000b2565b506001600160a01b0381166200007157604051631e4fbdf760e01b81526000600482015260240160405180910390fd5b6200007c81620000c4565b506003805460ff60a01b1916905560046200009883826200031c565b506005620000a782826200031c565b5050505050620003e8565b6002620000c082826200031c565b5050565b600380546001600160a01b038381166001600160a01b0319831681179093556040519116919082907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a35050565b634e487b7160e01b600052604160045260246000fd5b600082601f8301126200013e57600080fd5b81516001600160401b03808211156200015b576200015b62000116565b604051601f8301601f19908116603f0116810190828211818310171562000186576200018662000116565b81604052838152602092508683858801011115620001a357600080fd5b600091505b83821015620001c75785820183015181830184015290820190620001a8565b600093810190920192909252949350505050565b60008060008060808587031215620001f257600080fd5b84516001600160a01b03811681146200020a57600080fd5b60208601519094506001600160401b03808211156200022857600080fd5b62000236888389016200012c565b945060408701519150808211156200024d57600080fd5b6200025b888389016200012c565b935060608701519150808211156200027257600080fd5b5062000281878288016200012c565b91505092959194509250565b600181811c90821680620002a257607f821691505b602082108103620002c357634e487b7160e01b600052602260045260246000fd5b50919050565b601f8211156200031757600081815260208120601f850160051c81016020861015620002f25750805b601f850160051c820191505b818110156200031357828155600101620002fe565b5050505b505050565b81516001600160401b0381111562000338576200033862000116565b62000350816200034984546200028d565b84620002c9565b602080601f8311600181146200038857600084156200036f5750858301515b600019600386901b1c1916600185901b17855562000313565b600085815260208120601f198616915b82811015620003b95788860151825594840194600190910190840162000398565b5085821015620003d85787850151600019600388901b60f8161c191681555b5050505050600190811b01905550565b611ba780620003f86000396000f3fe608060405234801561001057600080fd5b50600436106101365760003560e01c80636b20c454116100b857806395d89b411161007c57806395d89b4114610272578063a22cb4651461027a578063e985e9c51461028d578063f242432a146102a0578063f2fde38b146102b3578063f5298aca146102c657600080fd5b80636b20c45414610221578063715018a614610234578063731133e91461023c5780638456cb591461024f5780638da5cb5b1461025757600080fd5b80631f7fdffa116100ff5780631f7fdffa146101c15780632eb2c2d6146101d45780633f4ba83a146101e75780634e1273f4146101ef5780635c975abb1461020f57600080fd5b8062fdd58e1461013b57806301ffc9a71461016157806302fe53051461018457806306fdde03146101995780630e89341c146101ae575b600080fd5b61014e6101493660046111b4565b6102d9565b6040519081526020015b60405180910390f35b61017461016f3660046111f4565b610301565b6040519015158152602001610158565b6101976101923660046112b5565b610351565b005b6101a1610365565b6040516101589190611355565b6101a16101bc366004611368565b6103f7565b6101976101cf36600461142f565b61042e565b6101976101e23660046114c7565b610448565b6101976104b4565b6102026101fd366004611570565b6104c6565b604051610158919061166a565b600354600160a01b900460ff16610174565b61019761022f36600461167d565b61059a565b6101976105fe565b61019761024a3660046116f0565b610610565b610197610624565b6003546040516001600160a01b039091168152602001610158565b6101a1610634565b610197610288366004611744565b610643565b61017461029b366004611780565b610652565b6101976102ae3660046117b3565b610680565b6101976102c1366004611817565b6106df565b6101976102d4366004611832565b61071a565b6000818152602081815260408083206001600160a01b03861684529091529020545b92915050565b60006001600160e01b03198216636cdb3d1360e11b148061033257506001600160e01b031982166303a24d0760e21b145b806102fb57506301ffc9a760e01b6001600160e01b03198316146102fb565b610359610750565b6103628161077d565b50565b60606004805461037490611865565b80601f01602080910402602001604051908101604052809291908181526020018280546103a090611865565b80156103ed5780601f106103c2576101008083540402835291602001916103ed565b820191906000526020600020905b8154815290600101906020018083116103d057829003601f168201915b5050505050905090565b60606000600261040684610789565b60405160200161041792919061189f565b60408051601f198184030181529190529392505050565b610436610750565b6104428484848461081b565b50505050565b336001600160a01b038616811480159061046957506104678682610652565b155b1561049f5760405163711bec9160e11b81526001600160a01b038083166004830152871660248201526044015b60405180910390fd5b6104ac8686868686610853565b505050505050565b6104bc610750565b6104c46108ba565b565b606081518351146104f75781518351604051635b05999160e01b815260048101929092526024820152604401610496565b600083516001600160401b0381111561051257610512611218565b60405190808252806020026020018201604052801561053b578160200160208202803683370190505b50905060005b845181101561059257602080820286010151610565906020808402870101516102d9565b82828151811061057757610577611926565b602090810291909101015261058b81611952565b9050610541565b509392505050565b6001600160a01b03831633148015906105ba57506105b88333610652565b155b156105ee57335b60405163711bec9160e11b81526001600160a01b0391821660048201529084166024820152604401610496565b6105f983838361090f565b505050565b610606610750565b6104c46000610955565b610618610750565b610442848484846109a7565b61062c610750565b6104c4610a04565b60606005805461037490611865565b61064e338383610a47565b5050565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205460ff1690565b336001600160a01b03861681148015906106a1575061069f8682610652565b155b156106d25760405163711bec9160e11b81526001600160a01b03808316600483015287166024820152604401610496565b6104ac8686868686610add565b6106e7610750565b6001600160a01b03811661071157604051631e4fbdf760e01b815260006004820152602401610496565b61036281610955565b6001600160a01b038316331480159061073a57506107388333610652565b155b1561074557336105c1565b6105f9838383610b6b565b6003546001600160a01b031633146104c45760405163118cdaa760e01b8152336004820152602401610496565b600261064e82826119b1565b6060600061079683610bd3565b60010190506000816001600160401b038111156107b5576107b5611218565b6040519080825280601f01601f1916602001820160405280156107df576020820181803683370190505b5090508181016020015b600019016f181899199a1a9b1b9c1cb0b131b232b360811b600a86061a8153600a85049450846107e957509392505050565b6001600160a01b03841661084557604051632bfa23e760e11b815260006004820152602401610496565b610442600085858585610cab565b6001600160a01b03841661087d57604051632bfa23e760e11b815260006004820152602401610496565b6001600160a01b0385166108a657604051626a0d4560e21b815260006004820152602401610496565b6108b38585858585610cab565b5050505050565b6108c2610cfe565b6003805460ff60a01b191690557f5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa335b6040516001600160a01b03909116815260200160405180910390a1565b6001600160a01b03831661093857604051626a0d4560e21b815260006004820152602401610496565b6105f9836000848460405180602001604052806000815250610cab565b600380546001600160a01b038381166001600160a01b0319831681179093556040519116919082907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a35050565b6001600160a01b0384166109d157604051632bfa23e760e11b815260006004820152602401610496565b604080516001808252602082018690528183019081526060820185905260808201909252906104ac600087848487610cab565b610a0c610d28565b6003805460ff60a01b1916600160a01b1790557f62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a2586108f23390565b6001600160a01b038216610a705760405162ced3e160e81b815260006004820152602401610496565b6001600160a01b03838116600081815260016020908152604080832094871680845294825291829020805460ff191686151590811790915591519182527f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31910160405180910390a3505050565b6001600160a01b038416610b0757604051632bfa23e760e11b815260006004820152602401610496565b6001600160a01b038516610b3057604051626a0d4560e21b815260006004820152602401610496565b60408051600180825260208201869052818301908152606082018590526080820190925290610b628787848487610cab565b50505050505050565b6001600160a01b038316610b9457604051626a0d4560e21b815260006004820152602401610496565b604080516001808252602082018590528183019081526060820184905260a082019092526000608082018181529192916108b391879185908590610cab565b60008072184f03e93ff9f4daa797ed6e38ed64bf6a1f0160401b8310610c125772184f03e93ff9f4daa797ed6e38ed64bf6a1f0160401b830492506040015b6d04ee2d6d415b85acef81000000008310610c3e576d04ee2d6d415b85acef8100000000830492506020015b662386f26fc100008310610c5c57662386f26fc10000830492506010015b6305f5e1008310610c74576305f5e100830492506008015b6127108310610c8857612710830492506004015b60648310610c9a576064830492506002015b600a83106102fb5760010192915050565b610cb785858585610d53565b6001600160a01b038416156108b35782513390600103610cf05760208481015190840151610ce9838989858589610d5f565b50506104ac565b6104ac818787878787610e83565b600354600160a01b900460ff166104c457604051638dfc202b60e01b815260040160405180910390fd5b600354600160a01b900460ff16156104c45760405163d93c066560e01b815260040160405180910390fd5b61044284848484610f6c565b6001600160a01b0384163b156104ac5760405163f23a6e6160e01b81526001600160a01b0385169063f23a6e6190610da39089908990889088908890600401611a70565b6020604051808303816000875af1925050508015610dde575060408051601f3d908101601f19168201909252610ddb91810190611ab5565b60015b610e47573d808015610e0c576040519150601f19603f3d011682016040523d82523d6000602084013e610e11565b606091505b508051600003610e3f57604051632bfa23e760e11b81526001600160a01b0386166004820152602401610496565b805181602001fd5b6001600160e01b0319811663f23a6e6160e01b14610b6257604051632bfa23e760e11b81526001600160a01b0386166004820152602401610496565b6001600160a01b0384163b156104ac5760405163bc197c8160e01b81526001600160a01b0385169063bc197c8190610ec79089908990889088908890600401611ad2565b6020604051808303816000875af1925050508015610f02575060408051601f3d908101601f19168201909252610eff91810190611ab5565b60015b610f30573d808015610e0c576040519150601f19603f3d011682016040523d82523d6000602084013e610e11565b6001600160e01b0319811663bc197c8160e01b14610b6257604051632bfa23e760e11b81526001600160a01b0386166004820152602401610496565b610f74610d28565b610442848484848051825114610faa5781518151604051635b05999160e01b815260048101929092526024820152604401610496565b3360005b83518110156110b9576020818102858101820151908501909101516001600160a01b03881615611061576000828152602081815260408083206001600160a01b038c1684529091529020548181101561103a576040516303dee4c560e01b81526001600160a01b038a166004820152602481018290526044810183905260648101849052608401610496565b6000838152602081815260408083206001600160a01b038d16845290915290209082900390555b6001600160a01b038716156110a6576000828152602081815260408083206001600160a01b038b168452909152812080548392906110a0908490611b30565b90915550505b5050806110b290611952565b9050610fae565b50825160010361113a5760208301516000906020840151909150856001600160a01b0316876001600160a01b0316846001600160a01b03167fc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62858560405161112b929190918252602082015260400190565b60405180910390a450506108b3565b836001600160a01b0316856001600160a01b0316826001600160a01b03167f4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb8686604051611189929190611b43565b60405180910390a45050505050565b80356001600160a01b03811681146111af57600080fd5b919050565b600080604083850312156111c757600080fd5b6111d083611198565b946020939093013593505050565b6001600160e01b03198116811461036257600080fd5b60006020828403121561120657600080fd5b8135611211816111de565b9392505050565b634e487b7160e01b600052604160045260246000fd5b604051601f8201601f191681016001600160401b038111828210171561125657611256611218565b604052919050565b60006001600160401b0383111561127757611277611218565b61128a601f8401601f191660200161122e565b905082815283838301111561129e57600080fd5b828260208301376000602084830101529392505050565b6000602082840312156112c757600080fd5b81356001600160401b038111156112dd57600080fd5b8201601f810184136112ee57600080fd5b6112fd8482356020840161125e565b949350505050565b60005b83811015611320578181015183820152602001611308565b50506000910152565b60008151808452611341816020860160208601611305565b601f01601f19169290920160200192915050565b6020815260006112116020830184611329565b60006020828403121561137a57600080fd5b5035919050565b60006001600160401b0382111561139a5761139a611218565b5060051b60200190565b600082601f8301126113b557600080fd5b813560206113ca6113c583611381565b61122e565b82815260059290921b840181019181810190868411156113e957600080fd5b8286015b8481101561140457803583529183019183016113ed565b509695505050505050565b600082601f83011261142057600080fd5b6112118383356020850161125e565b6000806000806080858703121561144557600080fd5b61144e85611198565b935060208501356001600160401b038082111561146a57600080fd5b611476888389016113a4565b9450604087013591508082111561148c57600080fd5b611498888389016113a4565b935060608701359150808211156114ae57600080fd5b506114bb8782880161140f565b91505092959194509250565b600080600080600060a086880312156114df57600080fd5b6114e886611198565b94506114f660208701611198565b935060408601356001600160401b038082111561151257600080fd5b61151e89838a016113a4565b9450606088013591508082111561153457600080fd5b61154089838a016113a4565b9350608088013591508082111561155657600080fd5b506115638882890161140f565b9150509295509295909350565b6000806040838503121561158357600080fd5b82356001600160401b038082111561159a57600080fd5b818501915085601f8301126115ae57600080fd5b813560206115be6113c583611381565b82815260059290921b840181019181810190898411156115dd57600080fd5b948201945b83861015611602576115f386611198565b825294820194908201906115e2565b9650508601359250508082111561161857600080fd5b50611625858286016113a4565b9150509250929050565b600081518084526020808501945080840160005b8381101561165f57815187529582019590820190600101611643565b509495945050505050565b602081526000611211602083018461162f565b60008060006060848603121561169257600080fd5b61169b84611198565b925060208401356001600160401b03808211156116b757600080fd5b6116c3878388016113a4565b935060408601359150808211156116d957600080fd5b506116e6868287016113a4565b9150509250925092565b6000806000806080858703121561170657600080fd5b61170f85611198565b9350602085013592506040850135915060608501356001600160401b0381111561173857600080fd5b6114bb8782880161140f565b6000806040838503121561175757600080fd5b61176083611198565b91506020830135801515811461177557600080fd5b809150509250929050565b6000806040838503121561179357600080fd5b61179c83611198565b91506117aa60208401611198565b90509250929050565b600080600080600060a086880312156117cb57600080fd5b6117d486611198565b94506117e260208701611198565b9350604086013592506060860135915060808601356001600160401b0381111561180b57600080fd5b6115638882890161140f565b60006020828403121561182957600080fd5b61121182611198565b60008060006060848603121561184757600080fd5b61185084611198565b95602085013595506040909401359392505050565b600181811c9082168061187957607f821691505b60208210810361189957634e487b7160e01b600052602260045260246000fd5b50919050565b60008084546118ad81611865565b600182811680156118c557600181146118da57611909565b60ff1984168752821515830287019450611909565b8860005260208060002060005b858110156119005781548a8201529084019082016118e7565b50505082870194505b50505050835161191d818360208801611305565b01949350505050565b634e487b7160e01b600052603260045260246000fd5b634e487b7160e01b600052601160045260246000fd5b6000600182016119645761196461193c565b5060010190565b601f8211156105f957600081815260208120601f850160051c810160208610156119925750805b601f850160051c820191505b818110156104ac5782815560010161199e565b81516001600160401b038111156119ca576119ca611218565b6119de816119d88454611865565b8461196b565b602080601f831160018114611a1357600084156119fb5750858301515b600019600386901b1c1916600185901b1785556104ac565b600085815260208120601f198616915b82811015611a4257888601518255948401946001909101908401611a23565b5085821015611a605787850151600019600388901b60f8161c191681555b5050505050600190811b01905550565b6001600160a01b03868116825285166020820152604081018490526060810183905260a060808201819052600090611aaa90830184611329565b979650505050505050565b600060208284031215611ac757600080fd5b8151611211816111de565b6001600160a01b0386811682528516602082015260a060408201819052600090611afe9083018661162f565b8281036060840152611b10818661162f565b90508281036080840152611b248185611329565b98975050505050505050565b808201808211156102fb576102fb61193c565b604081526000611b56604083018561162f565b8281036020840152611b68818561162f565b9594505050505056fea26469706673582212208a1247b42fd31f46a973bbd2c8f8324c79731b0fc6eec397a9de21a56a63a31464736f6c63430008130033";

export default () => {

  const navigate = useNavigate();
  const signer = useWalletsActiveSigner();

  const [params, setParams] = useState<{
    abi: string | undefined,
    bytecode: string | undefined,
    constructorParams: any[] | undefined
  }>({
    abi: undefined,
    bytecode: undefined,
    constructorParams: undefined
  });
  const [inputErrors, setInputErrors] = useState<{
    abi: string | undefined,
    bytecode: string | undefined
  }>({
    abi: undefined,
    bytecode: undefined
  });

  const [deployHash, setDeployHash] = useState<string>();
  const [deployError, setDeployError] = useState<string>();
  const [deploying, setDeploying] = useState<boolean>(false);

  const [IContract, setIContract] = useState<Interface>();
  const [constructorValues, setConstructorValues] = useState<any[]>([]);

  useEffect(() => {
    setIContract(undefined);
    setConstructorValues([]);
    if (params?.abi) {
      try {
        const IContract = new Interface(params.abi);
        setIContract(IContract);
      } catch (err: any) {
        setIContract(undefined);
        setInputErrors({
          ...inputErrors,
          abi: err.toString()
        })
      }
    }
  }, [params]);

  useEffect(() => {
    console.log("deploy page constructor values>>", constructorValues)
  }, [constructorValues]);

  const deployContract = () => {

    setDeployHash(undefined);
    setDeployError(undefined);

    if (!params?.abi) {
      inputErrors.abi = "请输入合约ABI"
    }
    if (!params?.bytecode) {
      inputErrors.bytecode = "请输入合约字节码"
    }
    if (inputErrors.abi || inputErrors.bytecode) {
      setInputErrors({
        ...inputErrors
      })
      return;
    }

    //
    const { abi, bytecode } = params;
    if (abi && bytecode) {
      const contractFactory = new ethers.ContractFactory(abi, bytecode, signer);
      setDeploying(true);
      contractFactory.deploy(...constructorValues).then((contract) => {
        setDeploying(false);
        setDeployHash(contract.deployTransaction.hash);
      }).catch((err: any) => {
        setDeploying(false);
        setDeployError(err.toString());
      })
    }
  }

  return <>
    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Button style={{ marginTop: "14px", marginRight: "12px", float: "left" }} size="large" shape="circle" icon={<LeftOutlined />} onClick={() => {
          navigate("/main/contracts")
        }} />
        <Title level={4} style={{ lineHeight: "16px" }}>
          合约部署
        </Title>
      </Col>
    </Row>

    <div style={{ width: "100%", paddingTop: "40px", minWidth: "1000px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Card>

          <Alert type='info' message={<>
            通过智能合约编辑器 (<Link onClick={() => window.open("https://remix.ethereum.org")}>Remix</Link>) 等工具编写合约后,将合约编译出的ABI和字节码复制到输入框来部署合约.
          </>} />

          <Spin spinning={deploying}>
            <Row style={{ marginTop: "20px" }}>
              <Col span={24}>
                <Text strong type='secondary'>合约ABI</Text>
              </Col>
              <Col span={24} style={{ marginTop: "5px" }}>
                <Input.TextArea onBlur={(event) => {
                  setParams({
                    ...params,
                    abi: event.target.value
                  });
                }} onChange={() => {
                  setInputErrors({
                    ...inputErrors,
                    abi: undefined
                  })
                }} style={{ minHeight: "100px" }} />
              </Col>
              {
                inputErrors?.abi && <Alert style={{ marginTop: "5px" }} type='error' showIcon message={inputErrors?.abi} />
              }

              <Col span={24} style={{ marginTop: "20px" }}>
                <Text strong type='secondary'>合约字节码(Bytecode)</Text>
              </Col>
              <Col span={24} style={{ marginTop: "5px" }}>
                <Input.TextArea onBlur={(event) => {
                  setParams({
                    ...params,
                    bytecode: event.target.value
                  });
                }} onChange={() => {
                  setInputErrors({
                    ...inputErrors,
                    bytecode: undefined
                  })
                }} style={{ minHeight: "100px" }} />
              </Col>

              {
                inputErrors?.bytecode && <Alert style={{ marginTop: "5px" }} type='error' showIcon message={inputErrors.bytecode} />
              }

              {
                IContract && IContract.deploy.inputs.length > 0 && <>
                  <Divider />
                  <ContractConstructor IContract={IContract} setConstructorValues={setConstructorValues} />
                </>
              }
              <Divider />

              <Col span={24}>
                {
                  deployError && <Alert style={{ marginBottom: "20px" }} showIcon type='error' message={<>
                    {deployError}
                  </>} />
                }
                {
                  deployHash && <Alert style={{ marginBottom: "20px" }} showIcon type='success' message={<>
                    <Row>
                      <Col span={24}>
                        <Text>交易哈希:{deployHash}</Text>
                        <Link onClick={()=>window.open(`${config.Safescan_URL}/tx/${deployHash}`)} style={{ float: "right" }}>浏览器上查看</Link>
                      </Col>
                    </Row>
                  </>} />
                }
                <Button onClick={deployContract} type='primary'>部署</Button>
              </Col>
            </Row>
          </Spin>
        </Card>



      </div>
    </div>

  </>

}
