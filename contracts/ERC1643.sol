pragma solidity 0.8.10;

contract ERC1643 {

    struct Doc {
        bytes32 _name;
        bytes32 _documentHash;
        string _uri;
        
    } // struct to handle the documents

    mapping (bytes32 => Doc) internal _documents;      


    event Document (bytes32 indexed _name, string _uri, bytes32 _documentHash);                       // event to be emitted whenever a document is put on-chain

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

}