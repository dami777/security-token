pragma solidity 0.8.10;

import "IERC1400.sol";


library OrderLibrary {

    struct OrderSwap {

        
        address _recipient;
        address _investor;
        IERC1400 _ERC1400_TOKEN;
        uint256 _price;
        uint256 _amount;
        uint256 _expiration;
        bytes32 _secretHash;
        bytes32 _secretKey;
        bytes32 _swapID;
        bytes32 _partition;
        bool _funded;
        
        
    }


    enum SwapState {

        INVALID,
        OPEN,
        CLOSED,
        EXPIRED

    }

}