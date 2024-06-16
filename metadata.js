import {
    Connection,
    Keypair,
    SystemProgram,
    Transaction,
    clusterApiUrl,
    sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
    ExtensionType,
    TOKEN_2022_PROGRAM_ID,
    createInitializeMintInstruction,
    getMintLen,
    createInitializeMetadataPointerInstruction,
    createInitializeTransferFeeConfigInstruction,
    getMint,
    getMetadataPointerState,
    mintTo,
    createAccount,
} from "@solana/spl-token";
import {
    createInitializeInstruction,
    createUpdateFieldInstruction,
    createRemoveKeyInstruction,
    unpack,
    pack,

} from "@solana/spl-token-metadata";


import { addKeypairToEnvFile } from '@solana-developers/node-helpers';
// Playground wallet
//   const payer = pg.wallet.keypair;


const privateKey = [31, 41, 187, 170, 199, 154, 29, 250, 144, 216, 8, 247, 107, 216, 182, 169, 134, 55, 70, 93, 116, 129, 187, 199, 156, 100, 117, 253, 116, 250, 222, 87, 15, 193, 218, 240, 133, 206, 2, 102, 193, 231, 145, 88, 6, 22, 90, 132, 187, 143, 100, 252, 179, 34, 237, 154, 84, 123, 113, 79, 121, 159, 23, 99]

// Create a keypair from the existing private key
const payer = Keypair.fromSecretKey(Buffer.from(privateKey, 'base64'));


// Connection to devnet cluster
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// Transaction to send
let transaction;
// Transaction signature returned from sent transaction
let transactionSignature;

// Generate new keypair for Mint Account
const mintKeypair = Keypair.generate();

await addKeypairToEnvFile(mintKeypair, 'mintKeypair');

// Address for Mint Account
const mint = mintKeypair.publicKey;
// Decimals for Mint Account
const decimals = 6;
// Authority that can mint new tokens
const mintAuthority = payer.publicKey
//   Keypair.generate();
//    payer
//   pg.wallet.publicKey;
// Authority that can update token metadata
const updateAuthority = payer.publicKey
//   Keypair.generate();
//   payer
//   pg.wallet.publicKey;

// Metadata to store in Mint Account
const metaData = {
    updateAuthority: updateAuthority,
    mint: mint,
    name: "NEW-TOKEN",
    symbol: "NEW-TOKEN",
    uri: "https://raw.githubusercontent.com/solana-developers/opos-asset/main/assets/DeveloperPortal/metadata.json",
    additionalMetadata: [["description", "Only Possible On Solana"]],
};

// Size of MetadataExtension 2 bytes for type, 2 bytes for length
const metadataExtension = 4;
// Size of metadata
const metadataLen = pack(metaData).length;

// Size of Mint Account with extension
const mintLen = getMintLen([ExtensionType.MetadataPointer]);

// Minimum lamports required for Mint Account
const lamports = await connection.getMinimumBalanceForRentExemption(
    mintLen + metadataExtension + metadataLen
);


// Instruction to invoke System Program to create new account
const createAccountInstruction = SystemProgram.createAccount({
    fromPubkey: payer.publicKey, // Account that will transfer lamports to created account
    newAccountPubkey: mint, // Address of the account to create
    space: mintLen, // Amount of bytes to allocate to the created account
    lamports, // Amount of lamports transferred to created account
    programId: TOKEN_2022_PROGRAM_ID, // Program assigned as owner of created account
});



const maxFee = BigInt(5_000);
const feeBasisPoints = 600;

const initializeTransferFeeConfig =
    createInitializeTransferFeeConfigInstruction(
        mint, // token mint account
        payer.publicKey, // authority that can update fees
        payer.publicKey, // authority that can withdraw fees
        feeBasisPoints, // amount of transfer collected as fees
        maxFee, // maximum fee to collect on transfers
        TOKEN_2022_PROGRAM_ID // SPL token program id
    );


// Instruction to initialize the MetadataPointer Extension
const initializeMetadataPointerInstruction =
    createInitializeMetadataPointerInstruction(
        mint, // Mint Account address
        updateAuthority, // Authority that can set the metadata address
        mint, // Account address that holds the metadata
        TOKEN_2022_PROGRAM_ID
    );
 
// Instruction to initialize Mint Account data
const initializeMintInstruction = createInitializeMintInstruction(
    mint, // Mint Account Address
    decimals, // Decimals of Mint
    mintAuthority, // Designated Mint Authority
    null, // Optional Freeze Authority
    TOKEN_2022_PROGRAM_ID // Token Extension Program ID
);

// Instruction to initialize Metadata Account data
const initializeMetadataInstruction = createInitializeInstruction({
    programId: TOKEN_2022_PROGRAM_ID, // Token Extension Program as Metadata Program
    metadata: mint, // Account address that holds the metadata
    updateAuthority: updateAuthority, // Authority that can update the metadata
    mint: mint, // Mint Account address
    mintAuthority: mintAuthority, // Designated Mint Authority
    name: metaData.name,
    symbol: metaData.symbol,
    uri: metaData.uri,
});

// Instruction to update metadata, adding custom field
const updateFieldInstruction = createUpdateFieldInstruction({
    programId: TOKEN_2022_PROGRAM_ID, // Token Extension Program as Metadata Program
    metadata: mint, // Account address that holds the metadata
    updateAuthority: updateAuthority, // Authority that can update the metadata
    field: metaData.additionalMetadata[0][0], // key
    value: metaData.additionalMetadata[0][1], // value
});

// Add instructions to new transaction
transaction = new Transaction().add(
    createAccountInstruction,
    // initializeTransferFeeConfig,
    initializeMetadataPointerInstruction,
    initializeMintInstruction,
    initializeMetadataInstruction,
    updateFieldInstruction
);

// Send transaction
transactionSignature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [payer, mintKeypair] // Signers
);

console.log(
    "\nCreate Mint Account:",
    `https://solana.fm/tx/${transactionSignature}?cluster=devnet-solana`
);

// Retrieve mint information
const mintInfo = await getMint(
    connection,
    mint,
    "confirmed",
    TOKEN_2022_PROGRAM_ID
);

// Retrieve and log the metadata pointer state
const metadataPointer = getMetadataPointerState(mintInfo);
console.log("\nMetadata Pointer:", JSON.stringify(metadataPointer, null, 2));

// Extract and log the metadata
const slicedBuffer = mintInfo.tlvData.subarray(72);
const metadata = unpack(slicedBuffer);
console.log("\nMetadata:", JSON.stringify(metadata, null, 2));

// Instruction to remove a key from the metadata
const removeKeyInstruction = createRemoveKeyInstruction({
    programId: TOKEN_2022_PROGRAM_ID, // Token Extension Program as Metadata Program
    metadata: mint, // Address of the metadata
    updateAuthority: updateAuthority, // Authority that can update the metadata
    key: metaData.additionalMetadata[0][0], // Key to remove from the metadata
    idempotent: true, // If the idempotent flag is set to true, then the instruction will not error if the key does not exist
});

// Add instruction to new transaction
transaction = new Transaction().add(removeKeyInstruction);

// Send transaction
transactionSignature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [payer]
);

console.log(
    "\nRemove Additional Metadata Field:",
    `https://solana.fm/tx/${transactionSignature}?cluster=devnet-solana`
);

console.log(
    "\nMint Account:",
    `https://solana.fm/address/${mint}?cluster=devnet-solana`
);

const sourceTokenAccount = await createAccount(
    connection,
    payer, // Payer to create Token Account
    mint, // Mint Account address
    payer.publicKey, // Token Account owner
    undefined, // Optional keypair, default to Associated Token Account
    undefined, // Confirmation options
    TOKEN_2022_PROGRAM_ID, // Token Extension Program ID
  );

transactionSignature = await mintTo(
    connection,
    payer, // Transaction fee payer
    mint, // Mint Account address
    sourceTokenAccount, // Mint to
    mintAuthority, // Mint Authority address
    1_000_000_000, // Amount
    undefined, // Additional signers
    undefined, // Confirmation options
    TOKEN_2022_PROGRAM_ID, // Token Extension Program ID
  );

  console.log(
    "\nMint Tokens:",
    `https://solana.fm/tx/${transactionSignature}?cluster=devnet-solana`,
  );