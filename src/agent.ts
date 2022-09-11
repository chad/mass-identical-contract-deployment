import {
  BlockEvent,
  Finding,
  HandleBlock,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";

const sha = require("js-sha256");

const { EVM } = require("evm");

export const ERC20_TRANSFER_EVENT =
  "event Transfer(address indexed from, address indexed to, uint256 value)";
export const TETHER_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
export const TETHER_DECIMALS = 6;
let findingsCount = 0;

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = [];

  // limiting this agent to emit only 5 findings so that the alert feed is not spammed
  if (findingsCount >= 5) return findings;
  if(isContractCreation(txEvent)) {
    console.log(txEvent.transaction);
    const evm = new EVM(txEvent.transaction.data);
    const opCodes = evm.getOpcodes();
    const codes = opCodes.map((code: any) => {
      return code["name"]
    });
    console.log(codes);
    // opCodes.forEach((code : any) => {
    //    if(code["pushData"] != null && typeof code["pushData"] != undefined) {
    //      console.log(code["name"]);
    //      console.log(code["pushData"]);
    //      console.log("***************************************************")
   
    //    }
    // })
    // console.log(evm.getOpcodes());
  }
  return findings;
  // filter the transaction logs for Tether transfer events
  const tetherTransferEvents = txEvent.filterLog(
    ERC20_TRANSFER_EVENT,
    TETHER_ADDRESS
  );

  tetherTransferEvents.forEach((transferEvent) => {
    // extract transfer event arguments
    const { to, from, value } = transferEvent.args;
    // shift decimals of transfer value
    const normalizedValue = value.div(10 ** TETHER_DECIMALS);

    // if more than 10,000 Tether were transferred, report it
    if (normalizedValue.gt(10000)) {
      findings.push(
        Finding.fromObject({
          name: "High Tether Transfer",
          description: `High amount of USDT transferred: ${normalizedValue}`,
          alertId: "FORTA-1",
          severity: FindingSeverity.Low,
          type: FindingType.Info,
          metadata: {
            to,
            from,
          },
        })
      );
      findingsCount++;
    }
  });

  return findings;
};

function isContractCreation(txEvent: TransactionEvent)  {
  return txEvent.transaction.to == "" || txEvent.transaction.to == undefined || txEvent.transaction.to == null;
}

// const handleBlock: HandleBlock = async (blockEvent: BlockEvent) => {
//   const findings: Finding[] = [];
//   // detect some block condition
//   return findings;
// }

export default {
  handleTransaction,
  // handleBlock
};
