// solidity version

pragma solidity 0.8.10;


contract ERC1400 {


    /************************************************ Variable Declarations and Initaalizations ************************************/



     // *************************************** Strings ********************************************************* //

    string internal name;   // token name
    string internal symbol; // token symbol



    // *************************************** Integers ********************************************************* //

    uint256 internal granularity;   // token decimal
    uint256 internal totalSupply; // token total supply


    // *************************************** Addresses ********************************************************* //

    address private owner;  // set the address of the owner to be private



     // *************************************** Booleans ********************************************************* //

    bool private lockUpTokens = true; // token lockup indicator
    bool private isIssuable;    //  manage when a token can be issued
    


     // *************************************** Structs ********************************************************* //

    struct Doc {
        bytes32 _name;
        bytes32 _documentHash;
        string _uri;
        
    } // struct to handle the documents



     // *************************************** Events ********************************************************* //

    event WhiteList (address _investor, uint256 _timeAdded);                                                 // event to be emitted whenever an address is whitelisted
    event Issued (address _to, uint256 _amountIssued, uint256 _totalSupply, uint256 _timeIssued);            // event to be emitted whenever new tokens are minted
    event Transfer (address _from, address _to, uint256 _amount);                                            // event to be emitted whenever token is been transferred
    event Approval (address _tokenHolder, address _externalAddress, uint256 _amount);                        // event to be emitted whenever an external address is approved such as escrows
    event Document (bytes32 _name, bytes32 _documentHash, string _uri );                                        // event to be emitted whenever a document is put on-chain



     // *************************************** Mappings ********************************************************* //

    mapping(address => bool) private whitelist;                             //  whitelist map
    mapping(address => mapping(address => uint256)) private allowance;      // set the address of the allowed external operator
    mapping(address => uint256) public balanceOf;                           // map to store the token balances of token holders
    mapping(bytes32 => uint256) public partitions;                          // map to store the partitions
    mapping(bytes => Doc) public documents;                                 // map to store the documents


    constructor (string memory _name, string memory _symbol, uint256 _granularity, uint256 _totalSupply) {

        name = _name;
        symbol = _symbol;
        granularity = _granularity; // same as decimals 
        totalSupply = _totalSupply;
        owner = msg.sender;

    }

    modifier restricted {
        require(msg.sender == owner, "0x56");
        _;
    }

    // *************************************** Internal functions ********************************************************* //

    // 1. internal funtion to transfer tokens from an address to another address
     function _transfer(address _from, address _to, uint256 _amount) internal returns (bool success) {

        require(_to != address(0),  "can't transfer to zero address");
        require(balanceOf[_from] >= _amount, "insufficient amount");

        balanceOf[_from] = balanceOf[_from] - _amount;                  // reduce the sender's balance --> use safemath
        balanceOf[_to] = balanceOf[_to] + _amount;                      // increase the value of the receiver ---> usesafemath
        emit Transfer (_from, _to, _amount);                            // emit the Tranfer event
        return true;
     }

    // function to mint and issue new tokens. This function is restricted to other addresses except the owner of the contract
    function  issueTokens(address _to, uint256 _amount) external restricted {
        
        
        require(_to != address(0));                                      // the destinaton address should not be an empty address
        balanceOf[_to] += _amount;                                       // use safemath library to avoid under and overflow
        totalSupply += _amount;                                          // add the new minted token to the total supply ---> use safemath library to avoid under and overflow
        emit Issued(_to, _amount, totalSupply, block.timestamp);        // emit the issued event --> it emits the destination address, amount minted, updated total supply and the time issued
        

    }


    // approve tokens to external operators
    function approve(address _externalAddress, uint256 _value) external returns (bool success) {

        require(_externalAddress != address(0), "56");                  //0x56   invalid external address
        allowance[msg.sender][_externalAddress] = _value;              // use safemath function here to avoid under and overflow
        emit Approval(msg.sender, _externalAddress, _value);            // emit the approved event
        return true;

    }



    // used bytes1 instead of byte as bytes1 is now an alias for byte    
    function canTransfer(address _to, uint256 _value) public view returns (bytes1 status, bytes32 statusDescription){

        if( lockUpTokens == true) {

            return (hex"55", "funds locked (lockup period)");
        } 

    }



    // function to add an address to whitelist
    function addToWhiteList(address _investor) external {
        
        require(!whitelist[_investor], "can't whitelist an address more than once");
        whitelist[_investor] = true;
        emit WhiteList(_investor, block.timestamp);

    }

    // function to transfer tokens. the internal transfer function will be called here
    function transfer(address _to, uint256 _amount) external returns (bool success) {

        _transfer(msg.sender, _to, _amount);
        return true;

    }

    // function transferFrom. The function for external addresses such as escrows to move tokens on behalf of the token holder
    
    function transferFrom(address _from, address _to, uint256 _amount) external returns (bool success) {

        // _from is the current token holder
        // _to is the destinantion address
        //  msg.sender is the external address calling this function
        // the token holder should have at least the amount of tokens to be transferred ----> this check has been implemented in the internal _transfer function
        require(allowance[_from][msg.sender] >= _amount);           // the allowed value approved by the token holder must not be less than the amount
        _transfer(_from, _to, _amount);                             // transfer the tokens

        // reset the allowance value

        allowance[_from][msg.sender] =  0;              

    }  



    /***************  Document *****************/

    // set document

    function setDocument (bytes32 _name, string calldata _uri, bytes32 _documentHash) external  {
        
        documents[_name] = Doc(_name, _uri, _documentHash);     // save the document
        emit Document(_name, _uri, _documentHash);              // emit event when document is set on chain

    }

    // get document
    
    function getDocument (bytes32 _name) external view returns (string memory, bytes32 _name) {

        Doc storage _document = documents[_name];

        return (_document._uri, _document._name);  // return the document uri and name

    }

}