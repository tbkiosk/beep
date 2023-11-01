// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@thirdweb-dev/contracts/base/ERC721Drop.sol";
import "@thirdweb-dev/contracts/lib/TWStrings.sol";
import "./interfaces/IERC6551Registry.sol";

contract Beep is ERC721Drop {
    using TWStrings for uint256;

    uint256 public quantityPerClaim = 1;
    string public globalBaseURI;

    event QuantityPerClaimUpdated(uint256 newQuantity);
    event GlobalBaseURIUpdated(string newURI);
    event TokenBoundAccountCreated(uint256 tokenId, address account);
    event InitialTokenTransferred(address to, uint256 amount, address token);

    struct ClaimAndCreateArgs {
        address receiver;
        uint256 quantity;
        address currency;
        uint256 pricePerToken;
        AllowlistProof allowlistProof;
        bytes data;
        address registry;
        address implementation;
        bytes32 salt;
        uint256 chainId;
        address tokenToTransfer;
        uint256 amountToTransfer;
    }

    constructor(
        address _defaultAdmin,
        string memory _name,
        string memory _symbol,
        address _royaltyRecipient,
        uint128 _royaltyBps,
        address _primarySaleRecipient
    )
        ERC721Drop(
            _defaultAdmin,
            _name,
            _symbol,
            _royaltyRecipient,
            _royaltyBps,
            _primarySaleRecipient
        )
    {}

    /// @dev Override _beforeClaim to add quantity check
    function _beforeClaim(
        address,
        uint256 _quantity,
        address,
        uint256,
        AllowlistProof calldata,
        bytes memory
    ) internal view virtual override {
        if (_quantity > quantityPerClaim) {
            revert("Too many tokens claimed at once");
        }
        if (_currentIndex + _quantity > nextTokenIdToLazyMint) {
            revert("Not enough minted tokens");
        }
    }

    /// @dev Override tokenURI to allow globalBaseURI added to tokenURI
    function tokenURI(
        uint256 _tokenId
    ) public view virtual override returns (string memory) {
        if (bytes(globalBaseURI).length > 0) {
            return string(abi.encodePacked(globalBaseURI, _tokenId.toString()));
        }
        return super.tokenURI(_tokenId);
    }

    function setQuantityPerClaim(uint256 _quantity) public onlyOwner {
        quantityPerClaim = _quantity;
        emit QuantityPerClaimUpdated(_quantity);
    }

    function setGlobalBaseURI(string memory _globalBaseURI) public onlyOwner {
        globalBaseURI = _globalBaseURI;
        emit GlobalBaseURIUpdated(_globalBaseURI);
    }

    function claimAndCreateTba(
        ClaimAndCreateArgs calldata _args
    ) public payable {
        uint256 startTokenId = _currentIndex;
        claim(
            _args.receiver,
            _args.quantity,
            _args.currency,
            _args.pricePerToken,
            _args.allowlistProof,
            _args.data
        );
        for (uint256 i = 0; i < _args.quantity; i++) {
            address account = _createTba(
                startTokenId + i,
                _args.registry,
                _args.implementation,
                _args.salt,
                _args.chainId
            );
            if (_args.amountToTransfer > 0) {
                _transferFund(
                    account,
                    _args.amountToTransfer,
                    _args.tokenToTransfer
                );
            }
        }
    }

    function _createTba(
        uint256 _tokenId,
        address _registry,
        address _implementation,
        bytes32 _salt,
        uint256 _chainId
    ) internal returns (address) {
        IERC6551Registry registry = IERC6551Registry(_registry);
        address account = registry.createAccount(
            _implementation,
            _salt,
            _chainId,
            address(this),
            _tokenId
        );
        emit TokenBoundAccountCreated(_tokenId, account);
        return account;
    }

    function _transferFund(
        address _to,
        uint256 _amount,
        address _token
    ) internal {
        IERC20(_token).transferFrom(msg.sender, _to, _amount);
        emit InitialTokenTransferred(_to, _amount, _token);
    }
}
