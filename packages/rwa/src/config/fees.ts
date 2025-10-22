import { parseEther } from "ethers";

export const Fees = {
    ExistentialDeposit: parseEther("0.0000000001"),
    FeePerMint:        parseEther("20"),
    NativeDepositPerMint: parseEther("2"),
    MachineValue:      parseEther("1000")
  } as const;