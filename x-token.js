// as used in https://www.youtube.com/watch?v=DQbt0-riooo

import * as mpl from "@metaplex-foundation/mpl-token-metadata";
import * as web3 from "@solana/web3.js";
import * as anchor from '@project-serum/anchor';

import {
    LAMPORTS_PER_SOL,
    clusterApiUrl,

} from '@solana/web3.js';

import fs from 'fs'
export function loadWalletKey(keypairFile) {
    // const fs = require("fs");
    const loaded = web3.Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(fs.readFileSync(keypairFile).toString())),
    );
    return loaded;
}

const INITIALIZE = false;

async function main() {
    console.log("let's name some tokens!");
    // const myKeypair =  web3.Keypair.generate();

    const privateKey = [31,41,187,170,199,154,29,250,144,216,8,247,107,216,182,169,134,55,70,93,116,129,187,199,156,100,117,253,116,250,222,87,15,193,218,240,133,206,2,102,193,231,145,88,6,22,90,132,187,143,100,252,179,34,237,154,84,123,113,79,121,159,23,99]

// Create a keypair from the existing private key
const myKeypair = web3.Keypair.fromSecretKey(Buffer.from(privateKey, 'base64'));

console.log(myKeypair.publicKey);

    // We establish a connection to the cluster
    // const cc = new web3.Connection(clusterApiUrl('devnet'), 'confirmed');

    // const airdropSignature = await cc.requestAirdrop(
    //     myKeypair.publicKey,
    //     LAMPORTS_PER_SOL
    //   );

    // await cc.confirmTransaction({
    //     signature: airdropSignature,
    //     ...(await cc.getLatestBlockhash()),
    // });

    // console.log(
    //     'myKeypair Account Balance:',
    //     await cc.getBalance(myKeypair.publicKey)
    // );

    // loadWalletKey("AndXYwDqSeoZHqk95TUC1pPdp93musGfCo1KztNFNBhd.json");
    // const payer = web3.Keypair.generate();

    const mint = new web3.PublicKey("G9v6W6ZywEAtnViVymZseehaKBoVkLoz4SzaM8EnCBxQ");
    const seed1 = Buffer.from(anchor.utils.bytes.utf8.encode("metadata"));
    const seed2 = Buffer.from(mpl.PROGRAM_ID.toBytes());
    const seed3 = Buffer.from(mint.toBytes());
    const [metadataPDA, _bump] = web3.PublicKey.findProgramAddressSync([seed1, seed2, seed3], mpl.PROGRAM_ID);
    const accounts = {
        metadata: metadataPDA,
        mint,
        mintAuthority: myKeypair.publicKey,
        payer: myKeypair.publicKey,
        updateAuthority: myKeypair.publicKey,
    }
    const dataV2 = {
        name: "Fake USD Token",
        symbol: "FUD",
        uri: "https://shdw-drive.genesysgo.net/ArP7jjhVZsp7vkzteU7mpKA1fyHRhv4ZBz6gR7MJ1JTC/metadata.json",
        // we don't need that
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null
    }
    let ix;
    if (INITIALIZE) {
        const args = {
            createMetadataAccountArgsV3: {
                data: dataV2,
                isMutable: true,
                collectionDetails: null
            }
        };
        ix = mpl.createCreateMetadataAccountV3Instruction(accounts, args);
    } else {
        const args = {
            updateMetadataAccountArgsV2: {
                data: dataV2,
                isMutable: true,
                updateAuthority: myKeypair.publicKey,
                primarySaleHappened: true
            }
        };
        ix = mpl.createUpdateMetadataAccountV2Instruction(accounts, args)
    }
    const tx = new web3.Transaction();
    tx.add(ix);
    const connection =new web3.Connection(clusterApiUrl('devnet'), 'confirmed');
    //  new web3.Connection("https://api.mainnet-beta.solana.com");
    const txid = await web3.sendAndConfirmTransaction(connection, tx, [myKeypair]);
    console.log(txid);

}

main().catch((error) => {
    console.log(error);
});