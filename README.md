# Mass Identical Contract Deployment

## Description

This agent detects the deployment of identical transactions in a short period of time.  It may detect NFT copy cat scams and other nefarious behavior.

## Supported Chains

- Ethereum

## Alerts


- MASS-CREATION-1
  - Fired when a transaction deploys a contract whose opcodes (but not necesarily data) are the same as the opcodes of other contracts this bot has seen a code-configurable number of times within a code-configurable window (see agent.ts).
  - Severity is always set to "Info" 
  - Type is always set to "Suspicious"
  - Includes the hash of the opcodes present in the contract as well as the number of deployments we have seen of these opcodes within the window

