// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@thirdweb-dev/contracts/external-deps/openzeppelin/token/ERC20/ERC20.sol";

contract USDC is ERC20 {
    constructor() ERC20("UDC Coin", "USDC") {
        _mint(msg.sender, 1000000000 * 10 ** decimals());
    }
}
