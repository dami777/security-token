// solidity version

pragma solidity 0.8.10;


contract ERC1400 {

    string internal name;   // token name
    string internal symbol; // token symbol
    uint256 internal decimal;   // token decimal
    address private owner;  // set the address of the owner to be private
    bool private lockUpTokens;

    mapping(address => mapping(address => uint256)) public allowance;   // set the address of the allowed external operator

    constructor (string memory _name, string memory _symbol, uint256 _decimal) {

        name = _name;
        symbol = _symbol;
        decimal = _decimal;
        owner = msg.sender;

    }

    modifier restricted {
        require(msg.sender == owner, "0x56");
        _;
    }


    // approve tokens to external operators
    function approve(address _externalAddress, uint256 _value) public returns (bool success) {

        // use safemath function here to avoid under and overflow
        allowance[msg.sender][_externalAddress] += _value;
        return true;

    }

    
    function canTransfer(address _to, uint256 _value) {



    }



    


}