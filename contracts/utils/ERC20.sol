pragma solidity 0.8.10;
// SPDX-License-Identifier: MIT

contract ERC20{
    string public name;
    string public symbol;
    uint256 public decimals = 18;
    uint256 public totalSupply;


    // Events
    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);

    //  1.  Track balances
    mapping(address => uint256) public balanceOf;

    //  2. Track the balances in the allowance
    mapping(address => mapping(address => uint256)) public allowance;

    

    constructor(string memory _name, string memory _symbol) {

        name = _name;
        symbol = _symbol;

        totalSupply = 1000000 * (10 ** decimals);

        // give the total supply to the owner of the smart contract

        balanceOf[msg.sender] = totalSupply;
    }


    // internal function to transfer

    function _transfer(address _from, address _to, uint256 _value) internal {
        
        // set the condition to validate that the sender has up to the amount to be sent
        require(balanceOf[_from] >= _value);
        require(_to != address(0));

        //decrease the balance of the sender
        balanceOf[_from] -= _value;


        //increase the balance of the receiver
        balanceOf[_to] += _value;

        emit Transfer(_from, _to, _value); 
    }

    //  
    function transfer(address _to, uint256 _value) public returns(bool success){

        _transfer(msg.sender, _to, _value);
        return true;

    }


    // Approve tokens

    function approve(address _spender, uint256 _value) public returns (bool success) {
        require(_spender != address(0));
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);

        return true;
    }

    // Transfer from

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {

        require(_value <= balanceOf[_from]);
        require(_value <= allowance[_from][msg.sender]);

        allowance[_from][msg.sender] -= _value;

        // from is the owner of the token
        // to is the destination of the token
        _transfer(_from, _to, _value);
        return true;
    }
    
}