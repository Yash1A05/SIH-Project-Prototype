import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();

  console.log("Starting deployment...");

  console.log("Deploying BlueCarbonRegistry...");

  const BlueCarbonRegistry =
    await ethers.getContractFactory("BlueCarbonRegistry");

  const registry =
    await BlueCarbonRegistry.deploy();

  await registry.waitForDeployment();

  const registryAddress =
    await registry.getAddress();

  console.log(
    "BlueCarbonRegistry deployed to:",
    registryAddress
  );

  console.log("Deploying CarbonCredit...");

  const CarbonCredit =
    await ethers.getContractFactory("CarbonCredit");

  const carbonCredit =
    await CarbonCredit.deploy();

  await carbonCredit.waitForDeployment();

  const carbonCreditAddress =
    await carbonCredit.getAddress();

  console.log(
    "CarbonCredit deployed to:",
    carbonCreditAddress
  );

  console.log("===================================");
  console.log("ALL CONTRACTS DEPLOYED SUCCESSFULLY");
  console.log("===================================");
}

main().catch((error) => {
  console.error("DEPLOYMENT ERROR:", error);
  process.exitCode = 1;
});
