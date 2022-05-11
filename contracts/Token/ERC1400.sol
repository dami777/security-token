// solidity version
pragma solidity 0.8.10;

import "../utils/CertificateLibrary.sol";


contract ERC1400 {


    /************************************************ Variable Declarations and Initaalizations ************************************/


    //Certificate certificate;


     // *************************************** Strings ********************************************************* //

    string public name;   // token name
    string public symbol; // token symbol



    // *************************************** Integers ********************************************************* //

    uint256 public granularity;                     // token granularity
    uint256 public totalSupply;                     // token total supply
    uint256 public decimals;                        //token decimals


    // *************************************** Addresses ********************************************************* //

    address private owner;  // set the address of the owner to be private



     // *************************************** Booleans ********************************************************* //

    bool private _lockUpTokens = false; // token lockup indicator
    bool private _isIssuable = true;    //  indicates when a token can be issued
    bool private _isControllable = true;   // private variable that indicates the controllability of the tokens
    

    // ************************ Array ******************************//

    bytes32[] internal _totalPartitions;
    bytes32[] internal _defaultPartitions;
    address[] internal _controllers;
    //bytes32[] internal _allDocuments;    // an array to store all the documents stored onchain


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
    event Document (bytes32 indexed _name, string _uri, bytes32 _documentHash);                       // event to be emitted whenever a document is put on-chain
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
    event RedeemedByPartition (bytes32 indexed _partition, address indexed _operator, address indexed _from, uint256 _amount, bytes _operatorData);     // event to be emitted when tokens are burnt from any partitions
    event Redeemed (address indexed _operator, address indexed _from, uint256 _value, bytes _data);          //  event to be emitted when a token is being redeemed
    event ControllerTransfer (address _controller, address indexed _from, address indexed _to, uint256 _value, bytes _data, bytes _operatorData); // event to be emitted whenever a controller forces a token transfer
    event ControllerRedemption (address _controller, address indexed _tokenHolder, uint256 _value, bytes _data, bytes _operatorData);        // event to be emitted whenever a controller forces token redemption from a token holder's wallet

     // *************************************** Mappings ********************************************************* //

    mapping (address => bool) private whitelist;                                     //  whitelist map
    mapping (address => mapping(address => uint256)) private allowance;              // set the address of the allowed external operator
    mapping (address => uint256) internal _balanceOf;                                // map to store the token balances of token holders
    //mapping(bytes32 => uint256) public partitions;                                  // map to store the total supply of each partitions partitions
    mapping (bytes32 => Doc) internal _documents;                                    // map to store the documents
    mapping (address => mapping(bytes32 => uint256)) internal _balanceOfByPartition; // map to store the partitioned token balance of a token holder 
    mapping (address => bytes32[]) internal _partitionsOf;                           // map that stores the partitions of a token holder
    mapping (address => mapping(address => bool)) internal _isOperator;              // map to approve or revoke operators for a token holder
    //mapping(bytes32 => uint256) internal _indexOfDocument;                          // map to store thei index position of a document
    mapping (bytes32 => uint256) internal _indexOfPartitions;

    // holder's address -> operator  address -> partition -> true/false
    mapping (address => mapping(address => mapping (bytes32 => bool))) internal _isOperatorForPartition;                  // map to approve or revoke operators by partition
    mapping (address => bool) private _isController;                                 // map to store the addresses of approved controllers
    mapping (address => uint256) private _indexOfController;                         // map to store the index position of controllers


    constructor (string memory _name, string memory _symbol, uint256 _decimals, uint256 _totalSupply, bytes32[] memory defaultPartitions) {

        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        granularity = 10 ** decimals; // for token decimals 
        totalSupply = _totalSupply;
        owner = msg.sender;
        _defaultPartitions = defaultPartitions;

    }

    modifier restricted {
        require(msg.sender == owner, "0x56");
        _;
    }


    // *************************************** Internal functions ********************************************************* //

    /// @dev    internal funtion to transfer tokens from an address to another address
    /// @notice `0x57` revert message if receiver is address 0
    /// @notice `0x52` insufficient balance
    /// @notice balance must be more or equal to the value to be transferred
    /// @dev    this version of solidity handles the underflow and overflow error
    /// @notice the emission of Transfer event
    /// @param  _from is the address the token is sent from
    /// @param  _to is the address the token is sent to
    /// @param  _amount is the value of tokens to be sent

    
    function _transfer(address _from, address _to, uint256 _amount) internal returns (bool success) {

        require(_to != address(0),  "0x57");        
        require(_balanceOf[_from] >= _amount, "0x52");      

        _balanceOf[_from] = _balanceOf[_from] - _amount;                  
        _balanceOf[_to] = _balanceOf[_to] + _amount;                      
        emit Transfer (_from, _to, _amount);                            
        return true;
     }


     /// @dev   internal funtion to transfer tokens by partitions from an address to another address
     /// @notice `0x57` revert message if receiver is address 0
     /// @notice `0x52` insufficient balance
     /// @dev   the total supply is the balance accross all partitions
     /// @notice the global balance of the sender and receiver is adjusted respectively
     /// @notice the emission of TransferByPartition and Transfer events

    function _transferByPartiton(bytes32 _partition, address _from, address _to, uint256 _value, bytes memory _data, bytes memory _operatorData) internal returns(bytes32) {
       
    
       require( _balanceOfByPartition[_from][_partition] >= _value, "0x52"); 
       require(_to != address(0),  "0x57");   

       _balanceOfByPartition[_from][_partition] = _balanceOfByPartition[_from][_partition] - _value;
       _balanceOf[_from] = _balanceOf[_from] - _value; // the value should reflect in the global token balance of the sender
       
       _balanceOfByPartition[_to][_partition] = _balanceOfByPartition[_to][_partition] + _value;
       _balanceOf[_to] = _balanceOf[_to] + _value; // the value should reflect in the global token balance of the receiver

       emit TransferByPartition(_partition, msg.sender, msg.sender, _to, _value, _data, _operatorData);
       emit Transfer(_from, _to, _value);

       return _partition;

    }

    // function to transfer by default Partitions

    function _transferByDefaultPartitions(address _from, address _to, uint256 _value) internal {


        require(_balanceOf[_from] >= _value, "0x52");        
        for (uint256 index = 0; index < _defaultPartitions.length; index++) {
            _transferByPartiton(_defaultPartitions[index], _from, _to, _value, "", "");
        }

    }

    // internal redeem by partition function


    function _redeemByPartition(bytes32 _partition, address _tokenHolder, uint256 _value, bytes memory _data, bytes memory _operatorData) internal {

       require(msg.sender != address(0), "0x56");
       require(_balanceOfByPartition[_tokenHolder][_partition] >= _value, "0x52");  // insufficient balance
       _balanceOfByPartition[_tokenHolder][_partition] = _balanceOfByPartition[_tokenHolder][_partition] - _value;
       _balanceOf[_tokenHolder] = _balanceOf[_tokenHolder] - _value; // the value should reflect in the global token balance of the sender
       
       _balanceOfByPartition[address(0)][_partition] = _balanceOfByPartition[address(0)][_partition] + _value;
       _balanceOf[address(0)] = _balanceOf[address(0)] + _value; // the value should reflect in the global token balance of the receiver
       totalSupply -= _value;
       emit RedeemedByPartition(_partition, msg.sender, _tokenHolder, _value, _operatorData);

    }

    // internal redeem function

    function _redeem(address _tokenHolder, uint256 _value, bytes memory _data) internal {

       require(_balanceOf[_tokenHolder] >= _value, "0x52"); // insufficient balance
       _transfer(_tokenHolder, address(0), _value);
       totalSupply -= _value;
       emit Redeemed(msg.sender, _tokenHolder, _value, _data);

    }


    function _isValidCertificate(bytes memory _data, uint256 _amount) public view returns (address _signer) {

        uint256 nonce = 1;
        (bytes memory _signature, bytes32 _salt, Certificate.Holder _from, Certificate.Holder _to) = Certificate.decodeData(_data);
        bytes32 _prefixedHash = Certificate.hashTransfer((address(this), "1", name, 1337, _salt), _from, _to, _amount, nonce);
        address _signer = Certificate.verifySignature(_signature, _prefixedHash);
        //require (owner == _signer || _isController[_signer], "0x59");   // invalid signer
        return _signer;

    }



    // **************************       ERC1400 FEATURES  ******************************************************//


    //  Default Partitions


    function setDefaultPartitions(bytes32[] calldata newDefaultPartitions) external  {
        _defaultPartitions = newDefaultPartitions;
    }
     
    // *********************    DOCUMENT MANAGEMENT  ---------- ERC 1643

    //  set document

    function setDocument (bytes32 _name, string calldata _uri, bytes32 _documentHash) external  {
        
        _documents[_name] = Doc(_name, _documentHash, _uri);     // save the document
        //_allDocuments.push(_name);
        //_indexOfDocument[_name] = _allDocuments.length;
        emit Document(_name, _uri, _documentHash);              // emit event when document is set on chain

    }

    // get document
    
    function getDocument (bytes32 _name) external view returns (string memory uri, bytes32 docHash) {

        Doc memory _document = _documents[_name];

        return (_document._uri, _document._documentHash);  // return the document uri and document hash

    }



    // *********************    TOKEN INFORMATION


    // function that returns balance
    
    function balanceOf(address _tokenHolder) external view returns (uint256) {
        return _balanceOf[_tokenHolder];
    }

    function balanceOfByPartition(bytes32 _partition, address _tokenHolder) external view returns (uint256) {
       return _balanceOfByPartition[_tokenHolder][_partition];
   }

   // function to return the partitions of a token holder

    function partitionsOf(address _tokenHolder) external view returns (bytes32[] memory) {

        bytes32[] memory _partitions = new bytes32[](_totalPartitions.length);
        for (uint256 index = 0; index < _totalPartitions.length; index++) {
            if (_balanceOfByPartition[_tokenHolder][_totalPartitions[index]] > 0) {
                _partitions[index] = _totalPartitions[index];
            }
        }

        return _partitions;
   }



    // *********************    TRANSFERS

    // approve tokens to external operators
    
    function approve(address _externalAddress, uint256 _value) external returns (bool success) {

        require(_externalAddress != address(0), "0x58");                  //    0x58   invalid operator
        allowance[msg.sender][_externalAddress] = _value;              // use safemath function here to avoid under and overflow
        emit Approval(msg.sender, _externalAddress, _value);            // emit the approved event
        return true;

    }


    // function to transfer tokens. the internal transfer function will be called here
    
    function transfer(address _to, uint256 _value) public returns (bool success) {

        _transfer(msg.sender, _to, _value);
        return true;

    }

    // function transferFrom. The function for external addresses such as escrows to move tokens on behalf of the token holder
    
    function transferFrom(address _from, address _to, uint256 _value) external returns (bool success) {

        // _from is the current token holder
        // _to is the destinantion address
        //  msg.sender is the external address calling this function
        // the token holder should have at least the amount of tokens to be transferred ----> this check has been implemented in the internal _transfer function

        require(allowance[_from][msg.sender] >= _value, "0x53");           // the allowed value approved by the token holder must not be less than the amount. Insufficient allowance
        _transfer(_from, _to, _value);                             // transfer the tokens

        // reset the allowance value

        allowance[_from][msg.sender] =  0;   
        return true;           

    }  

    // tranfer with data

    function transferWithData(address _to, uint256 _value, bytes memory _data) external {
        
        require(_isValidCertificate(_data, _value));
        _transfer(msg.sender, _to, _value);
    }
    

    function transferFromWithData(address _from, address _to, uint256 _value, bytes memory _data) external {
         require(allowance[_from][msg.sender] >= _value, "0x53");           // the allowed value approved by the token holder must not be less than the amount
        _transfer(_from, _to, _value);                              // transfer the tokens

        //  reset the allowance value

        allowance[_from][msg.sender] =  0;   
        
    }


    // *********************    PARTITION TOKEN TRANSFERS


    function transferByPartition(bytes32 _partition, address _to, uint256 _value, bytes memory _data) external returns (bytes32) {

        if (_data.length != 1) {

            require(_isValidCertificate(_data, _value));

        }
       _transferByPartiton(_partition, msg.sender, _to, _value, _data , "");
 
   }    

   // operator transfer by partition
   
   function operatorTransferByPartition(bytes32 _partition, address _from, address _to, uint256 _value, bytes memory _data, bytes memory _operatorData) external returns (bytes32) {

       require(_isValidCertificate(_operatorData, _value), "cant verify data");
       if(_isControllable == true && _isController[msg.sender]) {

           _transferByPartiton(_partition, _from, _to, _value, "", "");
           emit ControllerTransfer(msg.sender, _from, _to, _value, _data, _operatorData);       // forceful transfers

       } else {
            require(_isOperatorForPartition[_from][msg.sender][_partition] || _isOperator[_from][msg.sender], "0x56"); // 0x56 invalid sender
            _transferByPartiton(_partition, _from, _to, _value, "", "");
       }
      
       
   }



   // *********************    CONTROLLER OPERATION

   function isControllable() external view returns (bool) {
       return _isControllable;
   }

   function isController(address _controller) external view returns(bool) {
       return _isController[_controller];
   }

   function setControllability(bool _status) external restricted {
       _isControllable = _status;
   }

   function setController(address _controller) external restricted {

       require(_controller != address(0), "0x58");      // invalid transfer agent
       require(!_isController[_controller], "ACC");       // address is currently a controller
       _isController[_controller] = true;
       _controllers.push(_controller);
       _indexOfController[_controller] = _controllers.length - 1;

   }

   function getControllers() external view returns (address[] memory) {
       return _controllers;
   }

   function removeController(address _controller) external restricted {

        require(_controller != address(0), "0x58");     // invalid transfer agent
        require(_isController[_controller], "0x58");      // not recognized as a controller
        _isController[_controller] = false;
        delete _controllers[_indexOfController[_controller]];     // remove the controller from the array of controllers using their saved index value
       
   }

   function controllerTransfer(address _from, address _to, uint256 _value, bytes calldata _data, bytes calldata _operatorData) external {
        _transfer(_from, _to, _value);
        emit ControllerTransfer(msg.sender, _from, _to, _value, _data, _operatorData);
   }

   function controllerRedeem(address _tokenHolder, uint256 _value, bytes calldata _data, bytes calldata _operatorData) external {
        _redeem(_tokenHolder,  _value, _data);
        emit ControllerRedemption(msg.sender, _tokenHolder, _value, _data, _operatorData);
   }


   // *********************    OPERATOR MANAGEMENT


    function authorizeOperator (address _operator) public {
        _isOperator[msg.sender][_operator] = true;
        emit AuthorizedOperator(_operator, msg.sender);
    }

    function revokeOperator (address _operator) public {
        _isOperator[msg.sender][_operator] = false;
        emit RevokedOperator(_operator, msg.sender);
    }

    function authorizeOperatorByPartition (bytes32 _partition, address _operator) public  {
        _isOperatorForPartition[msg.sender][_operator][_partition] = true;
        emit AuthorizedOperatorByPartition(_partition, _operator, msg.sender);
    }

    function revokeOperatorByPartition (bytes32 _partition, address _operator) public {
        _isOperatorForPartition[msg.sender][_operator][_partition] = false;
        emit RevokedOperatorByPartition(_partition, _operator, msg.sender);
    }



    // *********************    OPERATOR INFORMATION



     function isOperator (address _operator, address _tokenHolder) external view returns (bool) {
        return _isOperator[_tokenHolder][_operator];
    }

    
    function isOperatorForPartition(bytes32 _partition, address _operator, address _tokenHolder) external view returns (bool) {
        return  _isOperatorForPartition[_tokenHolder][_operator][_partition];
    }



    // *********************    TOKEN ISSUANCE

    function isIssuable() external view returns (bool) {
        return _isIssuable;
    }


    // function to mint and issue new tokens. This function is restricted to other addresses except the owner of the contract
    
    function issue(address _tokenHolder, uint256 _value, bytes calldata _data) external restricted {
        
        require(_isIssuable, "0x55");     // can't issue tokens for now
        require(_tokenHolder != address(0), "0x57");        // invalid receiver
        uint256 amount =  _value * granularity;                         // the destinaton address should not be an empty address
        _balanceOf[_tokenHolder] += amount;                              
        totalSupply += amount;                                          // add the new minted token to the total supply ---> use safemath library to avoid under and overflow
        emit Issued(_tokenHolder, amount, totalSupply, block.timestamp);        // emit the issued event --> it emits the destination address, amount minted, updated total supply and the time issued
        

    }


     // function to issue new tokens by partition

   function issueByPartition(bytes32 _partition, address _tokenHolder, uint256 _value, bytes memory _data) public restricted {

        require(_isIssuable, "0x55"); // can't issue tokens for now
        uint256 amount =  _value * granularity; 
        _balanceOfByPartition[_tokenHolder][_partition] += amount;   // increment the partition's token balance of this token holder
        _balanceOf[_tokenHolder] += amount; // increment the total balance of this token holder 
        totalSupply += amount; // increase the total supply
        emit IssuedByPartition(_partition, msg.sender, _tokenHolder, amount, _data, "");
    

   }


   // *********************    TOKEN REDEMPTION


   function redeem(uint256 _value, bytes memory _data) external {

       require(_isValidCertificate(_data, _value));
       _redeem(msg.sender, _value, _data);

   }

   function redeemFrom(address _tokenHolder, uint256 _value, bytes memory _data) external {

        require(_isValidCertificate(_data, _value));
        require(allowance[_tokenHolder][msg.sender] >= _value, "0x53");  // insufficient allowance
        _redeem(_tokenHolder, _value, _data);

   }


   // function to redeem by partition

   function redeemByPartition(bytes32 _partition, uint256 _value, bytes memory _data) external {

        require(_isValidCertificate(_data, _value));  //  verify signer
       _redeemByPartition(_partition, msg.sender, _value, _data, "");

   }

   

   function operatorRedeemByPartition(bytes32 _partition, address _tokenHolder, uint256 _value, bytes memory _operatorData) external {

       require(_isValidCertificate(_operatorData, _value));           //  verify signer
       if(_isControllable == true && _isController[msg.sender]) {
            _redeemByPartition(_partition, _tokenHolder, _value, "", _operatorData);
            emit ControllerRedemption(msg.sender, _tokenHolder, _value, "", _operatorData);
       } else {
            require(_isOperator[_tokenHolder][msg.sender] || _isOperatorForPartition[_tokenHolder][msg.sender][_partition], "0x58");     // invalid operator
            _redeemByPartition(_partition, _tokenHolder, _value, "", _operatorData);
       }

   }


   // *********************    TRANSFER VALIDITY

    // used bytes1 instead of byte. bytes1 is now an alias for byte    

    function canTransfer(address _to, uint256 _value, bytes memory _data) external view returns (bytes1 code, bytes32 reason){

        if( _lockUpTokens == true) {

            return (hex"55", "funds locked (lockup period)");
        }

        if(_to == address(0)) {
            return (hex"57", "invalid receiver");
        } 

        if(_balanceOf[msg.sender] < _value) {
            return (hex"52", "insufficient balance");
        }

        if( _isValidCertificate(_data, _value) != true) {
            return (hex"59", "invalid signer");
        }

        return (hex"51", "transfer success");

    }

    function canTransferFrom(address _from, address _to, uint256 _value, bytes memory _data) external view returns (bytes1 code, bytes32 reason) {

        if(_balanceOf[_from] < _value) {
            return (hex"52", "insufficient balance");
        }

        if(allowance[_from][msg.sender] < _value) {
            return (hex"53", "insufficient allowance");
        }

        if(_to == address(0)) {
            return (hex"57", "invalid receiver");
        } 

        if(_isOperator[_from][msg.sender]) {
            return (hex"58", "invalid operator");
        } 

        if( _isValidCertificate(_data, _value) != true) {
            return (hex"59", "invalid signer");
        }

        return (hex"51", "transfer success");

    }

    // can transfer by partition

   function canTransferByPartition(address _from, address _to, bytes32 _partition, uint256 _value, bytes memory _data) external view returns(bytes1, bytes32, bytes32) {

       if (_to == address(0)) {
           return (hex"55", "invalid receiver", _partition);
       }

       if (_value > _balanceOfByPartition[_from][_partition]) {
           return (hex"55", "insufficient balance", _partition);
       }

       if( _isValidCertificate(_data, _value) != true) {
            return (hex"59", "invalid signer", _partition);
        }

        return (hex"51", "transfer success", _partition);


   }


   /*********************************************************************************/

   //function to return partitioned token balance

    function totalPartitions() external view returns (bytes32[] memory) {
       return _totalPartitions;
    }

    function setTotalPartitions(bytes32[] memory _newTotalPartitions) external {
        _totalPartitions = _newTotalPartitions;
    }


}