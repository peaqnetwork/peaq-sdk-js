import { parseUnits, parseEther } from "ethers";

export const Fees = {
    ExistentialDeposit: parseEther("0.0000000001"),
    FeePerMint:        parseUnits("20", 18),
    NativeDepositPerMint: parseEther("2"),
    MachineValue:      parseUnits("1000", 18)
  } as const;