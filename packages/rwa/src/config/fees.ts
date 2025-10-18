import { parseUnits, parseEther } from "ethers";

export const Fees = {
    FeePerMint:        parseUnits("20", 18),
    NativeDepositPerMint: parseEther("2"),
    MachineValue:      parseUnits("1000", 18)
  } as const;