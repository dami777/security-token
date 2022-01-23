// solidity version

pragma solidity 0.8.10;


contract ERC1400 {

    string public name;
    string public symbol;
    uint256 public decimal;

    constructor (string memory _name, string memory _symbol, uint256 _decimal) {

        name = _name;
        symbol = _symbol;
        decimal = _decimal;

    }

}