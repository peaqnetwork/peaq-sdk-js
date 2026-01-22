### TODO
Create batches for Token:
```
function batchTransfer(address[] calldata _toList, uint256[] calldata _amounts) external;
function batchForcedTransfer(address[] calldata _fromList, address[] calldata _toList, uint256[] calldata _amounts) external;
function batchMint(address[] calldata _toList, uint256[] calldata _amounts) external;
function batchBurn(address[] calldata _userAddresses, uint256[] calldata _amounts) external;
function batchSetAddressFrozen(address[] calldata _userAddresses, bool[] calldata _freeze) external;
function batchFreezePartialTokens(address[] calldata _userAddresses, uint256[] calldata _amounts) external;
function batchUnfreezePartialTokens(address[] calldata _userAddresses, uint256[] calldata _amounts) external;
```


Create batches for Identity Registry:
```
function batchRegisterIdentity(address[] calldata _userAddresses, IIdentity[] calldata _identities, uint16[] calldata _countries) external;
```