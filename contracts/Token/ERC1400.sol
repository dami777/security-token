// solidity version
pragma solidity 0.8.10;

import "../utils/CertificateLibrary.sol";

//  SPDX-License-Identifier: UNLICENSED


contract ERC1400 {


    /************************************************ Variable Declarations and Initaalizations ************************************/



     // *************************************** Strings ********************************************************* //

    string private _tokenName;   // token name
    string private _tokenSymbol; // token symbol



    // *************************************** Integers ********************************************************* //

    uint256 private _tokenGranularity;                     // token granularity
    uint256 private _totalSupply;                     // token total supply
   


    // *************************************** Addresses ********************************************************* //

    address private owner;  // set the address of the owner to be private



     // *************************************** Booleans ********************************************************* //

    bool private _lockUpTokens;     // token lockup indicator
    bool private _isIssuable;        //  indicates when a token can be issued
    bool private _isControllable;    // private variable that indicates the controllability of the tokens
    

    // ************************ Array ******************************//

    bytes32[] private _totalPartitions;
    address[] private _controllers;
    bytes32 _classless = "classless";
    


     // *************************************** Structs ********************************************************* //

    struct Doc {

        bytes32 _name;
        bytes32 _documentHash;
        string _uri;
        
    } // struct to handle the documents



    

     // *************************************** Mappings ********************************************************* //

    mapping (address => bool) private whitelist;                                     //  whitelist map
    mapping (address => mapping(address => uint256)) private allowance;              // set the address of the allowed external operator
    mapping (address => uint256) private _balanceOf;                                // map to store the token balances of token holders
    mapping (bytes32 => Doc) private _documents;                                    // map to store the documents
    mapping (address => mapping(bytes32 => uint256)) private _balanceOfByPartition; // map to store the partitioned token balance of a token holder 
    mapping (address => bytes32[]) private _partitionsOf;                           // map that stores the partitions of a token holder
    mapping (address => mapping(address => bool)) private _isOperator;              // map to approve or revoke operators for a token holder
    

    // holder's address -> operator  address -> partition -> true/false
    mapping (address => mapping(address => mapping (bytes32 => bool))) private _isOperatorForPartition;                  // map to approve or revoke operators by partition
    mapping (address => bool) private _isController;                                 // map to store the addresses of approved controllers
    mapping (address => uint256) private _indexOfController;                         // map to store the index position of controllers
    mapping (bytes => bool) private _usedSignatures;
    mapping (address => uint256) private _balanceOfByDefault;                        // default balance with no partitions

    constructor (string memory _name, string memory _symbol, uint256 _granularity) {

        _tokenName = _name;
        _tokenSymbol = _symbol;
        _tokenGranularity = 10 ** _granularity; // for token decimals 
        //owner = msg.sender;
        //_defaultPartitions = defaultPartitions;
        _setController(msg.sender);
    

    }

    modifier restricted {

        require(_isController[msg.sender], "0x56");
        _;
    }

    /**
        @dev    `_useCert` function verifies the signature sent.
        If the signature is valid, it registers it onchain to avoid replay attack

        @param _data is the encoded data containing the signature and the parameters to be used to generate prefixed hashed.
        The prefixed hash will be used to verify the signature

        @param _amount is the quantity of token to be sent in the transaction
        
     */


    function _useCert(bytes memory _data, uint256 _amount) internal {

        (bytes memory _signature, bytes32 _salt, uint256 _nonce, Certificate.Holder memory _from, Certificate.Holder memory _to) = Certificate.decodeData(_data);
        require(!_usedSignatures[_signature], "US");    // used signature
        address _signer = Certificate.returnSigner(_signature, _salt, _nonce, _from, _to, _amount, address(this), _tokenName);
        require(_isController[_signer], "IS");      // invalid signer
        _usedSignatures[_signature] = true;

    }

    /**
        @dev an internal function to set controllers

     */

    function _setController(address _controller) internal {
        _isController[_controller] = true;
       _controllers.push(_controller);
       _indexOfController[_controller] = _controllers.length - 1;
    }


    // *************************************** Internal functions ********************************************************* //

    
     /// @dev   internal funtion to transfer tokens by partitions from an address to another address
     /// @notice `0x57` revert message if receiver is address 0
     /// @notice `0x52` insufficient balance
     /// @dev   the total supply is the balance accross all partitions
     /// @notice the global balance of the sender and receiver is adjusted respectively
     /// @notice the emission of TransferByPartition and Transfer events

    function _transferByPartition(bytes32 _partition, address _from, address _to, uint256 _value, bytes memory _data, bytes memory _operatorData, bool _dataRequired) internal returns(bytes32) {
       

        require(!_lockUpTokens, "LUP");
        require( _balanceOfByPartition[_from][_partition] >= _value, "0x52"); 
        require(_to != address(0),  "0x57");

        if (_dataRequired == true && _data.length > 1) {

            _useCert(_data, _value); 

        } else if (_dataRequired == true && _data.length <= 1) {

            revert("DCBE");

        }
      

       _balanceOfByPartition[_from][_partition] = _balanceOfByPartition[_from][_partition] - _value;
       _balanceOf[_from] = _balanceOf[_from] - _value; // the value should reflect in the global token balance of the sender
       
       _balanceOfByPartition[_to][_partition] = _balanceOfByPartition[_to][_partition] + _value;
       _balanceOf[_to] = _balanceOf[_to] + _value; // the value should reflect in the global token balance of the receiver

        emit Transfer(_from, _to, _value);
        emit TransferByPartition(_partition, msg.sender, _from, _to, _value, _data, _operatorData);
       

        return _partition;

    }

   

 

    // **************************       ERC1400 FEATURES  ******************************************************//



    
    /**
        *   @dev    Document management
        *   @notice setDocument function
        *   @notice getDocument
    
    */


    /// @dev    function to set document onchain using the document hash from an IPFS
    /// @param  _name is the name of the document is bytes32
    /// @param  _uri is the uri of the document's location in the IPFS
    /// @param  _documentHash is the hash of the document saved returned from the IPFS     

    function setDocument (bytes32 _name, string memory _uri, bytes32 _documentHash) external  {
        
        _documents[_name] = Doc(_name, _documentHash, _uri);     // save the document
        emit Document(_name, _uri, _documentHash);              // emit event when document is set on chain

    }


    /// @dev    function to fetch the document details
    /// @param  _name is the name of the of document to be fetched
    /// @return uri is saved uri to be returned
    /// @return docHash is the hash of the document to be returned
    
    function getDocument (bytes32 _name) external view returns (string memory, bytes32) {

        Doc memory _document = _documents[_name];

        return (_document._uri, _document._documentHash);  // return the document uri and document hash

    }



    // *********************    TOKEN INFORMATION


    /// @dev    function to fetch the balance of the holder across all partitions
    /// @param _tokenHolder is the holder's address to be queried
    
    function balanceOf(address _tokenHolder) external view returns (uint256) {

        return _balanceOf[_tokenHolder];

    }


    /**
        @dev    function to return the partition balance of an holder
        The function returns the amount owned by the holder in the specified partition / class

        @param  _partition is the partition to query the balance from
        @param  _tokenHolder is the address of the holder to whose balance if to be checked and returned 
        @return the balance from the queried partition / class   
     */

    function balanceOfByPartition(bytes32 _partition, address _tokenHolder) external view returns (uint256) {
       return _balanceOfByPartition[_tokenHolder][_partition];
   }

   

   ///  @dev    Function to return the partitions that an holder is having
   ///  @param _tokenHolder is the address of the holder to be queried
   ///  @return an array of the partitions of an holder

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

    /// @dev    approve spenders to send tokens on the holder's behalf; such as escrows
    /// @dev    the function should be called before calling the transferFrom function
    
    function approve(address _externalAddress, uint256 _value) external returns (bool success) {

        require(_externalAddress != address(0), "0x58");                  //    0x58   invalid operator
        allowance[msg.sender][_externalAddress] = _value;              // use safemath function here to avoid under and overflow
        emit Approval(msg.sender, _externalAddress, _value);            // emit the approved event
        return true;

    }


    /// @dev function to transfer tokens from the classless partition. The internal transferByPartition function will be called here
    
    function transfer(address _to, uint256 _value) external returns (bool success) {

       _transferByPartition(_classless, msg.sender, _to, _value, "", "", false);
        return true;

    }

    /// @dev    The function for external addresses such as escrows to move the classless tokens on behalf of the token holder
    
    function transferFrom(address _from, address _to, uint256 _value) external returns (bool success) {


        require(allowance[_from][msg.sender] >= _value, "0x53");                        /// @dev the allowed value approved by the token holder must not be less than the amount. Insufficient allowance
        _transferByPartition(_classless, _from, _to, _value, "", "", false);                    /// @dev transfer the tokens from the classless partition
        allowance[_from][msg.sender] =  0;                                             ///  @dev reset the allowance value
        return true;           

    }  


    /**
        @dev transfer the classless token with data
        The function uses the _transferByPartition internal function

        @notice _data.length > 0, ensures that data with length 0 or 1 is not accepted and interpreted as empty data
    */ 


    function transferWithData(address _to, uint256 _value, bytes memory _data) external {
                   
        _transferByPartition(_classless, msg.sender, _to, _value, _data, "", true);
        
    }
    
     /**
        @dev external spender such as escrows transfer the classless token with data
        The function uses the _transferByPartition internal function

        @notice the allowance value was resetted to 0
        @notice _data.length > 0, ensures that data with length 0 or 1 is not accepted and interpreted as empty data
     */ 

    function transferFromWithData(address _from, address _to, uint256 _value, bytes memory _data) external {
         
        require(allowance[_from][msg.sender] >= _value, "0x53");           // the allowed value approved by the token holder must not be less than the amount
        _transferByPartition(_classless, _from, _to, _value, _data, "", true);
        allowance[_from][msg.sender] =  0;   
        
    }


    // *********************    PARTITION TOKEN TRANSFERS


    function transferByPartition(bytes32 _partition, address _to, uint256 _value, bytes memory _data) external returns (bytes32) {

       _transferByPartition(_partition, msg.sender, _to, _value, _data , "", true);
        return _partition;

    }    

   // operator transfer by partition
   
    function operatorTransferByPartition(bytes32 _partition, address _from, address _to, uint256 _value, bytes memory _data, bytes memory _operatorData) external returns (bytes32) {

        
        if(_isControllable == true && _isController[msg.sender]) {

            _transferByPartition(_partition, _from, _to, _value, _data, "", true);
            emit ControllerTransfer(msg.sender, _from, _to, _value, _data, _operatorData);       // forceful transfers

        } else {
                require(_isOperatorForPartition[_from][msg.sender][_partition] || _isOperator[_from][msg.sender], "0x56"); // 0x56 invalid sender
                _transferByPartition(_partition, _from, _to, _value, _data, "", true);
        }

        return _partition;
        
        
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
      _setController(_controller);

   }

   function getControllers() external view returns (address[] memory) {
       return _controllers;
   }

   function removeController(address _controller) external restricted {

        require(_controller != address(0) && _isController[_controller], "0x58");     // invalid transfer agent
        _isController[_controller] = false;
        delete _controllers[_indexOfController[_controller]];     // remove the controller from the array of controllers using their saved index value
       
   }

   function controllerTransfer(address _from, address _to, uint256 _value, bytes memory _data, bytes memory _operatorData) external restricted {
        require(_isControllable, "NC");
        _transferByPartition(_classless, _from, _to, _value, _data, _operatorData, true);
        emit ControllerTransfer(msg.sender, _from, _to, _value, _data, _operatorData);
   }

   function controllerRedeem(address _tokenHolder, uint256 _value, bytes memory _data, bytes memory _operatorData) external restricted {
        require(_isControllable, "NC");
        _redeemByPartition(_classless, _tokenHolder, _value, _data, _operatorData);
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

    /**
        @dev    function to know the issuance status of a token; if it is issuable or not
     */

    function isIssuable() external view returns (bool) {

        return _isIssuable;

    }

    /** 
        @dev    internal function to execute issuance to investors
    
    */

    function _issue(bytes32 _partition, address _tokenHolder, uint256 _value, bytes memory _data) internal {

        require(_isIssuable, "0x55");                                       // can't issue tokens for now
        require(_tokenHolder != address(0), "0x57");                        // invalid receiver
        require(_data.length > 1, "DCBE");                   //  data must not be empty
        _useCert(_data, _value);                                            // verify the certificate
        uint256 amount =  _value * _tokenGranularity;                             // the destinaton address should not be an empty address
        _balanceOfByPartition[_tokenHolder][_partition] += amount;          // update the classless token reserve balance of the holder
        _balanceOf[_tokenHolder] += amount;                                 // update the general balance reserve of the holder                
        _totalSupply += amount;                                              // add the new minted token to the total supply ---> use safemath library to avoid under and overflow
        emit Issued(msg.sender, _tokenHolder, amount, _data);               // emit the issued event
        emit IssuedByPartition(_partition, msg.sender, _tokenHolder, amount, _data, "");

    }


    /**
        @dev    function to mint and issue new tokens. This function is restricted to other addresses except the controllers of the contract

        The tokens are issued to the classless partition. This will serve as default reserve for securities with no class
     */ 
    
    function issue(address _tokenHolder, uint256 _value, bytes memory _data) external restricted {
        
        _issue(_classless, _tokenHolder, _value, _data);
        

    }


    /**
        @dev    function to mint and issue new tokens to the specified partition of an holder. 
        
        This function is restricted to other addresses except the owner of the contract

     */ 

    function issueByPartition(bytes32 _partition, address _tokenHolder, uint256 _value, bytes memory _data) external restricted {

        _issue(_partition, _tokenHolder, _value, _data);
    

    }


   // *********************    TOKEN REDEMPTION


   /**
        @dev the internal function to redeem tokens 
    */


    function _redeemByPartition(bytes32 _partition, address _tokenHolder, uint256 _value, bytes memory _data, bytes memory _operatorData) internal {

       require(_tokenHolder != address(0), "0x57");
       require(_balanceOfByPartition[_tokenHolder][_partition] >= _value, "0x52");              // insufficient balance
       _useCert(_data, _value);
       _balanceOfByPartition[_tokenHolder][_partition] = _balanceOfByPartition[_tokenHolder][_partition] - _value;
       _balanceOf[_tokenHolder] = _balanceOf[_tokenHolder] - _value; // the value should reflect in the global token balance of the sender
       _totalSupply -= _value;
       
    }

   
    /**
        @dev function to redeem from the default partition
     */
   function redeem(uint256 _value, bytes memory _data) external {

        _redeemByPartition(_classless, msg.sender, _value, _data, "");
        emit Redeemed(msg.sender, msg.sender, _value, _data);

   }

    /**
        @dev function to for an external spender to redeem function
     */
   function redeemFrom(address _tokenHolder, uint256 _value, bytes memory _data) external {

        require(allowance[_tokenHolder][msg.sender] >= _value, "0x53");  // insufficient allowance
        _redeemByPartition(_classless, _tokenHolder, _value, _data, "");
         emit Redeemed(msg.sender, _tokenHolder, _value, _data);

   }


   // function to redeem by partition

   function redeemByPartition(bytes32 _partition, uint256 _value, bytes memory _data) external {

       _redeemByPartition(_partition, msg.sender, _value, _data, "");
       emit RedeemedByPartition(_partition, msg.sender, msg.sender, _value, _data);

   }

   

   function operatorRedeemByPartition(bytes32 _partition, address _tokenHolder, uint256 _value, bytes memory _operatorData) external {

       //require(_isValidCertificate(_operatorData, _value));           //  verify signer
       if(_isControllable == true && _isController[msg.sender]) {
            _redeemByPartition(_partition, _tokenHolder, _value, _operatorData, "");
            emit ControllerRedemption(msg.sender, _tokenHolder, _value, _operatorData, _operatorData);
       } else {
            require(_isOperator[_tokenHolder][msg.sender] || _isOperatorForPartition[_tokenHolder][msg.sender][_partition], "0x56");     // invalid operator
            _redeemByPartition(_partition, _tokenHolder, _value, _operatorData, "");
       }

       emit RedeemedByPartition(_partition, msg.sender, _tokenHolder, _value, _operatorData);

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

       /*if( _isValidCertificate(_data, _value) != true) {
            return (hex"59", "invalid signer", _partition);
        }*/

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


    /**
        @dev    Functions to set the lockup and issuable status of the token.

        
        If setLockUp is true, all transfers will be disabled until the lockup is set to false
        If setIssuable is false, tokens can't be issued until set to true 
     */



    function setLockUp(bool _lockUp) external restricted {

        _lockUpTokens = _lockUp;
        

    }

    function setIssuable(bool _issuable) external restricted {

        _isIssuable = _issuable;
        

    }

    /**
        @dev functions to return the token details 

        1.  name
        2.  symbol
        3.  total supply

     */

    function name() external view returns (string memory) {

        return _tokenName;

    }

    function symbol() external view returns (string memory) {

        return _tokenSymbol;

    }


     function totalSupply() external view returns (uint256) {

         return _totalSupply;

     }

    function granularity() external view returns (uint256) {

        return _tokenGranularity;

    }
    


   

     // *************************************** Events ********************************************************* //

    
    event Issued (address indexed _operator, address indexed _to, uint256 _value, bytes _data);            // event to be emitted whenever new tokens are minted
    event Transfer (address indexed _from, address indexed _to, uint256 _value);                                            // event to be emitted whenever token is been transferred
    event Approval (address indexed _owner, address indexed _spender, uint256 _value);                        // event to be emitted whenever an external address is approved such as escrows
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
    event IssuedByPartition (bytes32 indexed _partition, address indexed _operator, address indexed _to, uint256 _value, bytes _data, bytes _operatorData);    //  event to be emitted whenever a new token is issued to an holder's partition
    event RedeemedByPartition (bytes32 indexed _partition, address indexed _operator, address indexed _from, uint256 _value, bytes _operatorData);     // event to be emitted when tokens are burnt from any partitions
    event Redeemed (address indexed _operator, address indexed _from, uint256 _value, bytes _data);          //  event to be emitted when a token is being redeemed
    event ControllerTransfer (address _controller, address indexed _from, address indexed _to, uint256 _value, bytes _data, bytes _operatorData); // event to be emitted whenever a controller forces a token transfer
    event ControllerRedemption (address _controller, address indexed _tokenHolder, uint256 _value, bytes _data, bytes _operatorData);        // event to be emitted whenever a controller forces token redemption from a token holder's wallet
    

}


