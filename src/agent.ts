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

const THRESHOLD_FOR_DUPLICATE_CONTRACT_COUNT = 5
const THRESHOLD_FOR_DUPLICATE_CONTRACT_TIMING_IN_MILLISECONDS = 60 * 1000
/* FIXME: I believe this is safe because every agent is running in a single-threaded manner.  Need to verify
*/

type Deployment = { deployingContract: string, timestamp: number }

const hashesOfContractsWeHaveSeen: { [codeHash: string]: Array<Deployment> } = {}


const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = [];


  if (!isContractCreation(txEvent))
    return findings;


  const evm = new EVM(txEvent.transaction.data);
  const codes = getOpCodeNamesFromContractInOrder(evm);

  const hashedOpCodes = sha256(codes.join(""));
  hashesOfContractsWeHaveSeen[hashedOpCodes] ||= [];

  const deployment: Deployment = {
    deployingContract: txEvent.transaction.from,
    timestamp: (new Date()).getTime()
  }
  hashesOfContractsWeHaveSeen[hashedOpCodes].push(deployment);
  console.log(hashesOfContractsWeHaveSeen);
  if (manyInstancesOfidenticalContractsRecentlyDeployed(hashedOpCodes)) {
    findings.push(Finding.fromObject({
      name: "Mass Contract Creation",
      description: "Contract with same code deployed multiple times",
      alertId: "MASS-CREATION-1",
      severity: FindingSeverity.Info,
      type: FindingType.Suspicious,
      metadata: {
        hashedOpCodes: hashedOpCodes
      }
    }))
  }


  return findings;
}

function getOpCodeNamesFromContractInOrder(evm: any) {
  const opCodes = evm.getOpcodes();
  const codes = opCodes.map((code: any) => {
    return code["name"];
  });
  return codes;
}

function isContractCreation(txEvent: TransactionEvent) {
  return txEvent.transaction.to == "" || txEvent.transaction.to == undefined || txEvent.transaction.to == null;
}

export default {
  handleTransaction
};
function manyInstancesOfidenticalContractsRecentlyDeployed(hashedOpCodes: string): boolean {
  throw new Error("Function not implemented.");
}

