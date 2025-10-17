Please help me write documentation similar to <link previous doc>

with entry/return types <paste entry/return types used in sdk>:
```bash
export type IssueKycClaim = {
    claimIssuer: Signer;
    issuerContract: string;
    identity: string;
    name: string;
    lastName: string;
    dataOfBirth: string;
    placeOfBirth: string;
    uri: string | null; // should peaq ever hold a store of URIs?
}

and return object type:
export type KycClaimResult = {
    claim: IClaim;
    signature: string;
}

export interface IClaim {
    identity: string;
    issuer: string;
    topic: number;
    scheme: number;
    data: string;
    uri: string;
}
```


in a working RWA framework. Some other documentation: <paste full flow docs>:
```bash
/**
 * @dev Generates and signs a KYC claim containing name, last name, date of birth and place of birth
 * @param claimIssuer The ClaimIssuer signer
 * @param identityK The Identity contract instance or its EVM address
 * @param claimIssuerK The ClaimIssuer contract instance or its EVM address
 * @param name The first name of the identity owner
 * @param lastName The last name of the identity owner
 * @param dateOfBirth The date of birth of the identity owner in ISO format (YYYY-MM-DD)
 * @param placeOfBirth The place of birth of the identity owner
 * @return An object containing the IClaim data and the KYC signature
 */
 ```


 here is the working sdk code <paste code>
 ```bash


 ```