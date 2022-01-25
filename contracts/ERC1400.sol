// solidity version

pragma solidity 0.8.10;


contract ERC1400 {


    /*
    
     variables declaration

    */

    //  string

    string internal name;   // token name
    string internal symbol; // token symbol

    //  uints
    uint256 internal decimal;   // token decimal

    //  addresses
    address private owner;  // set the address of the owner to be private

    // boolean
    bool private lockUpTokens = true; // token lockup indicator
    bool private isIssuable;    //  manage when a token can be issued
    


    // structs

    struct KYC {

        string _firstname;
        string _lastname;
        string _othername;
        string _location;
        address _walletAddress;

        
    }

    //  events
    event WhiteList (address _investor, uint256 _timeAdded); // event to be emitted whenever an address is whitelisted
    event Issued (address _to, uint256 _amountIssued, uint256 _timeIssued); // event to be emitted whenever new tokens are minted



    //  mappings
    mapping(address => bool) private whitelist; //  whitelist map
    mapping(address => mapping(address => uint256)) public allowance;   // set the address of the allowed external operator
    mapping(address => uint256) public balanceOf; // map to store the token balances of addresses


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

    // function to mint and issue new tokens
    function  issueTokens(address _to, uint256 _amount) public restricted {
        


    }


    // approve tokens to external operators
    function approve(address _externalAddress, uint256 _value) public returns (bool success) {

        // use safemath function here to avoid under and overflow
        allowance[msg.sender][_externalAddress] += _value;
        return true;

    }



    // used bytes1 instead of byte as bytes1 is now an alias for byte    
    function canTransfer(address _to, uint256 _value) public view returns (bytes1 status, bytes32 statusDescription){

        if( lockUpTokens == true) {

            return (hex"55", "funds locked (lockup period)");
        } 

    }



    // function to add an address to whitelist
    function addToWhiteList(address _investor) public {
        
        require(!whitelist[_investor], "this investor has been onboared before");
        whitelist[_investor] = true;
        emit WhiteList(_investor, block.timestamp);

    
    }

}