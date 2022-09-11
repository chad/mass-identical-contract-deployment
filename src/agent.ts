import {
  BlockEvent,
  Finding,
  HandleBlock,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";
import { sha256 } from "js-sha256";

const sha = require("js-sha256");

const { EVM } = require("evm");

export const ERC20_TRANSFER_EVENT =
  "event Transfer(address indexed from, address indexed to, uint256 value)";
export const TETHER_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
export const TETHER_DECIMALS = 6;
let findingsCount = 0;

/* FIXME: I believe this is safe because every agent is running in a single-threaded manner.  Need to validate
*/

type Deployment = {deployingContract: string, timestamp: number }

const hashesOfContractsWeHaveSeen : {[codeHash: string] :  Array<Deployment>} = {}


const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = [];

  // limiting this agent to emit only 5 findings so that the alert feed is not spammed
  if (findingsCount >= 5) return findings;
  if(isContractCreation(txEvent)) {
    const evm = new EVM(txEvent.transaction.data);
    const opCodes = evm.getOpcodes();
    const codes = opCodes.map((code: any) => {
      return code["name"]
    });
    
    const hashedCodes = sha256(codes.join(""));
    hashesOfContractsWeHaveSeen[hashedCodes] ||= [];

    const deployment : Deployment = {
      deployingContract: txEvent.transaction.from,
      timestamp: (new Date()).getTime()
    }
    hashesOfContractsWeHaveSeen[hashedCodes].push(deployment);
    console.log(hashesOfContractsWeHaveSeen);

  }
  return findings;
}

function isContractCreation(txEvent: TransactionEvent)  {
  return txEvent.transaction.to == "" || txEvent.transaction.to == undefined || txEvent.transaction.to == null;
}

export default {
  handleTransaction,
  // handleBlock
};
