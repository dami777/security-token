// solidity version

pragma solidity 0.8.10;


contract ERC1400 {


    /************************************************ Variable Declarations and Initaalizations ************************************/



     // *************************************** Strings ********************************************************* //

    string public name;   // token name
    string public symbol; // token symbol



    // *************************************** Integers ********************************************************* //

    uint256 public granularity;   // token granularity
    uint256 public totalSupply; // token total supply
    uint256 public decimals; //token decimals


    // *************************************** Addresses ********************************************************* //

    address private owner;  // set the address of the owner to be private



     // *************************************** Booleans ********************************************************* //

    bool private lockUpTokens = false; // token lockup indicator
    bool private isIssuable;    //  manage when a token can be issued
    

    // ************************ Array ******************************//

    bytes32[] internal _totalPartitions;
    bytes21[] internal defaultPartitions;


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
    event Document (bytes32 _name, bytes32 _documentHash, string _uri);                                      // event to be emitted whenever a document is put on-chain
    event TransferByPartition (

        bytes32 indexed _fromPartition,
        address _operator,
        address indexed _from,
        address indexed _to,
        uint256 _value,
        bytes _data,
        bytes _operatorData


    );                                                                           // event to be emitted whenever tokens are transfered from an address partition to another addres of same partition

    event AuthorizedOperator (address indexed _operator, address indexed _tokenHolder);     // event to be emitted whenever an operator is authorized
    event RevokedOperator (address indexed _operator, address indexed _tokenHolder);     // event to be emitted whenever an operator is revoked
    event AuthorizedOperatorByPartition (bytes32 indexed _partition, address indexed _operator, address indexed _tokenHolder);     // event to be emitted whenever an operator is authorized for a partition
    event RevokedOperatorByPartition (bytes32 indexed _partition, address indexed _operator, address indexed _tokenHolder);     // event to be emitted whenever an operator is revoked for a partition
    event IssuedByPartition (bytes32 indexed _partition, address indexed _operator, address indexed _to, uint256 _amount, bytes _data, bytes _operatorData);    //  event to be emitted whenever a new token is issued to an holder's partition

     // *************************************** Mappings ********************************************************* //

    mapping(address => bool) private whitelist;                             //  whitelist map
    mapping(address => mapping(address => uint256)) private allowance;      // set the address of the allowed external operator
    mapping(address => uint256) internal _balanceOf;                           // map to store the token balances of token holders
    mapping(bytes32 => uint256) public partitions;                          // map to store the total supply of each partitions partitions
    mapping(bytes32 => Doc) public documents;                               // map to store the documents
    mapping(address => mapping(bytes32 => uint256)) internal _balanceOfByPartition;        // map to store the partitioned token balance of a token holder 
    mapping(address => bytes32[]) internal _partitionsOf;                         // map that stores the partitions of a token holder
    mapping(address => mapping(address => bool)) internal _isOperator;       // map to approve or revoke operators for a token holder
    
    // holder's address -> operator  address -> partition -> true/false
    mapping(address => mapping(address => mapping (bytes32 => bool))) internal _isOperatorForPartition;                  // map to approve or revoke operators by partition

    constructor (string memory _name, string memory _symbol, uint256 _decimals, uint256 _totalSupply, bytes32[] memory _defaultPartitions) {

        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        granularity = 10 ** decimals; // for token decimals 
        totalSupply = _totalSupply;
        owner = msg.sender;
        _totalPartitions = _defaultPartitions;

    }

    modifier restricted {
        require(msg.sender == owner, "0x56");
        _;
    }

    // *************************************** Internal functions ********************************************************* //

    // 1. internal funtion to transfer tokens from an address to another address
     function _transfer(address _from, address _to, uint256 _amount) internal returns (bool success) {

        require(_to != address(0),  "can't transfer to zero address");
        require(_balanceOf[_from] >= _amount, "insufficient amount");

        _balanceOf[_from] = _balanceOf[_from] - _amount;                  // reduce the sender's balance --> use safemath
        _balanceOf[_to] = _balanceOf[_to] + _amount;                      // increase the value of the receiver ---> usesafemath
        emit Transfer (_from, _to, _amount);                            // emit the Tranfer event
        return true;
     }

    // function to mint and issue new tokens. This function is restricted to other addresses except the owner of the contract
    function issueTokens(address _to, uint256 _amount) external restricted {
        
        
        require(_to != address(0));
        uint256 amount =  _amount * granularity;                         // the destinaton address should not be an empty address
        _balanceOf[_to] += amount;                                       // use safemath library to avoid under and overflow
        totalSupply += amount;                                          // add the new minted token to the total supply ---> use safemath library to avoid under and overflow
        emit Issued(_to, amount, totalSupply, block.timestamp);        // emit the issued event --> it emits the destination address, amount minted, updated total supply and the time issued
        

    }


    // approve tokens to external operators
    function approve(address _externalAddress, uint256 _value) external returns (bool success) {

        require(_externalAddress != address(0), "56");                  //0x56   invalid external address
        allowance[msg.sender][_externalAddress] = _value;              // use safemath function here to avoid under and overflow
        emit Approval(msg.sender, _externalAddress, _value);            // emit the approved event
        return true;

    }


    // function that returns balance
    function balanceOf(address _tokenHolder) external view returns (uint256) {
        return _balanceOf[_tokenHolder];
    }



    // used bytes1 instead of byte as bytes1 is now an alias for byte    
    function canTransfer(address _to, uint256 _value) public view returns (bytes1 status, bytes32 statusDescription){

        if( lockUpTokens == true) {

            return (hex"55", "funds locked (lockup period)");
        } 

    }



    // function to add an address to whitelist
    function addToWhiteList(address _investor) external restricted {
        
        require(!whitelist[_investor], "can't whitelist an address more than once");
        whitelist[_investor] = true;
        emit WhiteList(_investor, block.timestamp);

    }

    // function to transfer tokens. the internal transfer function will be called here
    function transfer(address _to, uint256 _amount) public returns (bool success) {

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
        return true;           

    }  



    /***************  Document *****************/

    // set document

    function setDocument (bytes32 _name , bytes32 _documentHash, string calldata _uri) external  {
        
        documents[_name] = Doc(_name, _documentHash, _uri);     // save the document
        emit Document(_name, _documentHash, _uri);              // emit event when document is set on chain

    }

    // get document
    
    function getDocument (bytes32 _name) external view returns (string memory uri, bytes32 name) {

        Doc storage _document = documents[_name];

        return (_document._uri, _document._name);  // return the document uri and name

    }

    /******************************* operators ***************************/

    function isOperator (address _from, address _operator) public returns (bool) {
        return _isOperator[_from][_operator];
    }

    function authorizeOperator (address _operator) public {
        _isOperator[msg.sender][_operator] = true;
        emit AuthorizedOperator(_operator, msg.sender);
    }

    function revokeOperator (address _operator) public {
        _isOperator[msg.sender][_operator] = false;
        emit RevokedOperator(_operator, msg.sender);
    }

    function isOperatorForPartition(address _from, address _operator, bytes32 _partition) public view returns (bool) {
        return  _isOperatorForPartition[_from][_operator][_partition];
    }
    
    function authorizeOperatorByPartition (address _operator, bytes32 _partition) public  {
        _isOperatorForPartition[msg.sender][_operator][_partition] = true;
        emit AuthorizedOperatorByPartition(_partition, _operator, msg.sender);
    }

    function revokeOperatorByPartition (address _operator, bytes32 _partition) public {
        _isOperatorForPartition[msg.sender][_operator][_partition] = false;
        emit RevokedOperatorByPartition(_partition, _operator, msg.sender);
    }
   
   /************************************* Partitions ****************************/


   /************************ Internal functions for partition ************************/

    function _transferByPartiton(bytes32 _partition, address _from, address _to, uint256 _value, bytes memory _data, bytes memory _operatorData) internal returns(bytes32) {
       
       if (_partition == "") {
           _transfer(msg.sender, _to, _value);
       }

       require( _balanceOfByPartition[msg.sender][_partition] >= _value); // the partiton balance of the holder must be greater than or equal to the value

       _balanceOfByPartition[msg.sender][_partition] = _balanceOfByPartition[msg.sender][_partition] - _value;
       _balanceOf[msg.sender] = _balanceOf[msg.sender] - _value; // the value should reflect in the global token balance of the sender
       
       _balanceOfByPartition[_to][_partition] = _balanceOfByPartition[_to][_partition] + _value;
       _balanceOf[_to] = _balanceOf[_to] + _value; // the value should reflect in the global token balance of the receiver

       emit TransferByPartition(_partition, msg.sender, msg.sender, _to, _value, "", "");

       return _partition;

    }


   /*********************************************************************************/

   // function to return partitioned token balance

   function totalPartitions () external view returns (bytes32[] memory) {
       return _totalPartitions;
   }

   function balanceOfByPartition(bytes32 _partition, address _tokenHolder) external view returns (uint256) {
       return _balanceOfByPartition[_tokenHolder][_partition];
   }

   // function to return the partitions of a token holder

   function partitionsOf(address _tokenHolder) external view returns (bytes32[] memory) {

       return _partitionsOf[_tokenHolder];

   }    

   // transfer by partition
   function transferByPartition(bytes32 _partition, address _to, uint256 _value, bytes calldata _data) external returns (bytes32) {

       _transferByPartiton(_partition, msg.sender, _to, _value, _data, "");
 
   }    

   // operator transfer by partition
   function operatorTransferByPartition(bytes32 _partition, address _from, address _to, uint256 _value, bytes calldata _data, bytes calldata _operatorData) external returns (bytes32) {

       require(isOperatorForPartition(_from, msg.sender, _partition), "56"); // 0x56 invalid sender
       _transferByPartiton(_partition, _from, _to, _value, "", "");
   }

   // function to issue new tokens by partition
   function issueByPartition(bytes32 _partition, address _tokenHolder, uint256 _value, bytes32 _data) external {

        _balanceOfByPartition[_partition][_tokenHolder] += _value;   // increment the partition's token balance of this token holder
        _balanceOf[_tokenHolder] += _value; // increment the total balance of this token holder 
        emit IssuedByPartition(_partition, msg.sender, _tokenHolder, _value, _data, "");

   }


}