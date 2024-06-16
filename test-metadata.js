import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
  createInitializeTransferFeeConfigInstruction,
  ExtensionType,
  getMintLen,
  LENGTH_SIZE,
  TOKEN_2022_PROGRAM_ID,
  TYPE_SIZE,
} from '@solana/spl-token';
import { createInitializeInstruction, pack } from '@solana/spl-token-metadata';

(async () => {
  const payer = Keypair.generate();

  // const privateKey = [31, 41, 187, 170, 199, 154, 29, 250, 144, 216, 8, 247, 107, 216, 182, 169, 134, 55, 70, 93, 116, 129, 187, 199, 156, 100, 117, 253, 116, 250, 222, 87, 15, 193, 218, 240, 133, 206, 2, 102, 193, 231, 145, 88, 6, 22, 90, 132, 187, 143, 100, 252, 179, 34, 237, 154, 84, 123, 113, 79, 121, 159, 23, 99]

  // Create a keypair from the existing private key
  // const payer = Keypair.fromSecretKey(Buffer.from(privateKey, 'base58'));

console.log("payer",payer.publicKey);
  const mint = Keypair.generate();
  const decimals = 9;

  const metadata = {
    mint: mint.publicKey,
    name: 'TOKEN_NAME',
    symbol: 'SMBL',
    uri: 'URI',
    additionalMetadata: [['new-field', 'new-value']],
  };


  // Define the extensions to be used by the mint
const extensions = [
  ExtensionType.TransferFeeConfig,
  ExtensionType.MetadataPointer,
];

// Calculate the length of the mint
const mintLen = getMintLen(extensions);   

  // const mintLen = getMintLen([ExtensionType.MetadataPointer]);

  const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;

  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');



  const feeBasisPoints = 60
  const maxFee = BigInt(5_000);
  // const mintLamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);
  const mintLamports = await connection.getMinimumBalanceForRentExemption(mintLen+metadataLen);
  const mintTransaction = new Transaction().add(  
    SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mint,
        space: mintLen,
        lamports: mintLamports,
        programId: TOKEN_2022_PROGRAM_ID,
    }),
    
    createInitializeTransferFeeConfigInstruction(
        mint,
        payer.publicKey,
        payer.publicKey,
        feeBasisPoints,
        maxFee,
        TOKEN_2022_PROGRAM_ID
    ),
    createInitializeMetadataPointerInstruction(
      mint.publicKey,
      payer.publicKey,
      mint.publicKey,
      TOKEN_2022_PROGRAM_ID
        // mint,
        // payer.publicKey,
        // mint,
        // TOKEN_2022_PROGRAM_ID
    ),
    createInitializeMintInstruction(mint.publicKey, decimals, payer.publicKey, null, TOKEN_2022_PROGRAM_ID),
    createInitializeInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        mint: mint.publicKey,
        metadata: mint.publicKey,
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.uri,
        mintAuthority: payer.publicKey,
        updateAuthority: payer.publicKey,
    }),
);
const newTokenTx = await sendAndConfirmTransaction(connection, mintTransaction, [payer, mint]);
console.log("New Token Created:", newTokenTx);

  // const mintTransaction = new Transaction().add(
  //   SystemProgram.createAccount({
  //     fromPubkey: payer.publicKey,
  //     newAccountPubkey: mint.publicKey,
  //     space: mintLen,
  //     lamports: mintLamports,
  //     programId: TOKEN_2022_PROGRAM_ID,
  //   }),
  //   createInitializeTransferFeeConfigInstruction(
  //     mint,
  //     payer.publicKey,
  //     payer.publicKey,
  //     t,
  //     BigInt(0),
  //     TOKEN_2022_PROGRAM_ID
  //   ),
  //   createInitializeMetadataPointerInstruction(mint.publicKey, payer.publicKey, mint.publicKey, TOKEN_2022_PROGRAM_ID),
    
  //   createInitializeMintInstruction(mint.publicKey, decimals, payer.publicKey, null, TOKEN_2022_PROGRAM_ID),
  //   createInitializeInstruction({
  //     programId: TOKEN_2022_PROGRAM_ID,
  //     mint: mint.publicKey,
  //     metadata: mint.publicKey,
  //     name: metadata.name,
  //     symbol: metadata.symbol,
  //     uri: metadata.uri,
  //     mintAuthority: payer.publicKey,
  //     updateAuthority: payer.publicKey,
  //   }),
  // );

  // const sig = await sendAndConfirmTransaction(connection, mintTransaction, [payer, mint]);

  // console.log('Signature:', sig);


//   const mintTransaction = new Transaction().add(  
//     SystemProgram.createAccount({
//         fromPubkey: payer.publicKey,
//         newAccountPubkey: mint,
//         space: mintLen,
//         lamports: mintLamports,
//         programId: TOKEN_2022_PROGRAM_ID,
//     }),
    
//     createInitializeTransferFeeConfigInstruction(
//         mint,
//         payer.publicKey,
//         payer.publicKey,
//         feeBasisPoints,
//         maxFee,
//         TOKEN_2022_PROGRAM_ID
//     ),
//     createInitializeMetadataPointerInstruction(
//         mint,
//         payer.publicKey,
//         mint,
//         TOKEN_2022_PROGRAM_ID
//     ),
//     createInitializeMintInstruction(mint, decimals, mintAuthority.publicKey, null, TOKEN_2022_PROGRAM_ID),
//     createInitializeInstruction({
//         programId: TOKEN_2022_PROGRAM_ID,
//         mint: mint.publicKey,
//         metadata: mint.publicKey,
//         name: metadata.name,
//         symbol: metadata.symbol,
//         uri: metadata.uri,
//         mintAuthority: payer.publicKey,
//         updateAuthority: payer.publicKey,
//     }),
// );
// const newTokenTx = await sendAndConfirmTransaction(connection, mintTransaction, [payer, mintKeypair], undefined);
// console.log("New Token Created:", generateExplorerTxUrl(newTokenTx));

})();