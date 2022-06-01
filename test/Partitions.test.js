require("chai")
    .use(require("chai-as-promised"))
    .should()



const ERC1400 = artifacts.require('./ERC1400')

const { stringToHex, setToken, certificate, tokens, ETHER_ADDRESS, reverts, tanglAdministratorPrivkey, BYTES_0 } = require("./helper")




contract ("Partitions", ([tanglAdministrator, investor_Dami, investor_Jeff])=>{

    let tanglSecurityToken

    let classA = stringToHex("CLASS A")
    let classB = stringToHex("CLASS B")
    let classless = stringToHex("classless").hex

    let tanglTokenDetails = setToken("TANGL", "TAN", 18, 0, [classA.hex,classB.hex])


    let tanglAdministratorData = {
            
        firstName: "tangl administrator",
        lastName: "tangl administrator",
        location: "New Yoke, London",
        walletAddress: tanglAdministrator

    }

    let investorDamiData = {

        firstName: "Dami",
        lastName: "Ogunkeye",
        location: "New Yoke, London",
        walletAddress: investor_Dami

    }


    let investorJeffData = {

        firstName: "Jeff",
        lastName: "Chuka",
        location: "New Yoke, London",
        walletAddress: investor_Jeff

    }

    const salt = "0xa99ee9d3aab69713b85beaef7f222d0304b9c35e89072ae3c6e0cbabcccacc0a"



    beforeEach( async()=>{
        
        tanglSecurityToken = await ERC1400.new(tanglTokenDetails.name, tanglTokenDetails.symbol, tanglTokenDetails.decimal, {from: tanglAdministrator})
        await tanglSecurityToken.setIssuable(true, {from: tanglAdministrator})


        tanglDomainData = {

            name: tanglTokenDetails.name,
            version: "1",
            chainId: 1337,
            verifyingContract: tanglSecurityToken.address,
            salt: salt //"0x0daa2a09fd91f1dcd75517ddae4699d3ade05dd587e55dc861fe82551d2c0b66"
    
        }

    })

    describe("contract address", ()=>{

        it("has contract address", ()=>{
            tanglSecurityToken.address.should.not.be.equal("", "the contract has an address")
        })

    })

    describe("partitions of an holder", ()=>{

        beforeEach(async()=>{

            let issuanceCert1 = await certificate(tanglAdministratorData, investorJeffData, 5, 1, tanglDomainData, tanglAdministratorPrivkey)
            let issuanceCert2 = await certificate(tanglAdministratorData, investorJeffData, 5, 2, tanglDomainData, tanglAdministratorPrivkey)
            let issuanceCert3 = await certificate(tanglAdministratorData, investorDamiData, 5, 3, tanglDomainData, tanglAdministratorPrivkey)


            //  Issue to investor Jeff
            await tanglSecurityToken.issueByPartition(classA.hex, investor_Jeff, 5, issuanceCert1, {from: tanglAdministrator})  // issue tokens to an holder's partiton
            await tanglSecurityToken.issueByPartition(classB.hex, investor_Jeff, 5, issuanceCert2, {from: tanglAdministrator})  // issue tokens to an holder's partiton


            //   Issue to investor Dami

            await tanglSecurityToken.issueByPartition(classA.hex, investor_Dami, 5, issuanceCert3, {from: tanglAdministrator})  // issue tokens to an holder's partiton


            //  set the total partitions onchain

            await tanglSecurityToken.setTotalPartitions([classA.hex, classB.hex])

        })

        it("returns the number of partitions that the investor holds", async()=>{

            const partitionsOfDami = await tanglSecurityToken.partitionsOf(investor_Dami)
            const partitionsOfJeff = await tanglSecurityToken.partitionsOf(investor_Jeff)
            
            partitionsOfJeff.length.should.be.equal(2, "it emits the number of partitions that investor jeff has")
            

            /**
             * In the real sense, Investor Dami holds only a since partition, however, bytes 0 will be returned
             * for the partitions he doesn't hold but the number of partitions remain the same for all investors.
             * 
             * For partitions they don't hold, zero will be returned
             */
            partitionsOfDami.length.should.be.equal(2, "it emits the number of partitions that investor dami has")
            partitionsOfDami[1].should.be.equal(BYTES_0, "it returns bytes 0 for default empty partitions of an holder")
           
        })

    })

})