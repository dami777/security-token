pragma solidity 0.8.10;


library OrderLibrary {

    struct OrderSwap {

        
        address _recipient;
        address _investor;
        uint256 _price;
        uint256 _amount;
        uint256 _expiration;
        bytes32 _secretHash;
        bytes32 _secretKey;
        bytes32 _swapID;
        bytes32 _partition;
        bool _funded;
        IERC1400 ERC1400_TOKEN;
        
    }


    enum SwapState {

        INVALID,
        OPEN,
        CLOSED,
        EXPIRED

    }

}