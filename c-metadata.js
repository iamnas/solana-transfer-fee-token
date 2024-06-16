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
// import  { TokenMetadata } from '@solana/spl-token-metadata';
import {
    createInitializeInstruction,
    pack,
    createUpdateFieldInstruction,
    createRemoveKeyInstruction,
} from '@solana/spl-token-metadata';

(async () => {

    const privateKey = [31, 41, 187, 170, 199, 154, 29, 250, 144, 216, 8, 247, 107, 216, 182, 169, 134, 55, 70, 93, 116, 129, 187, 199, 156, 100, 117, 253, 116, 250, 222, 87, 15, 193, 218, 240, 133, 206, 2, 102, 193, 231, 145, 88, 6, 22, 90, 132, 187, 143, 100, 252, 179, 34, 237, 154, 84, 123, 113, 79, 121, 159, 23, 99]

    // Create a keypair from the existing private key
    const payer = Keypair.fromSecretKey(Buffer.from(privateKey, 'base64'));

    // const payer = Keypair.generate();

    const mint = Keypair.generate();
    const decimals = 9;

    const metadata = {
        mint: mint.publicKey,
        name: 'TOKEN_NAME',
        symbol: 'SMBL',
        uri: 'URI',
        additionalMetadata: [['new-field', 'new-value']],
    };

    // const mintLen = getMintLen([ExtensionType.MetadataPointer]);

    const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;

    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

    // const airdropSignature = await connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL);
    // await connection.confirmTransaction({
    //     signature: airdropSignature,
    //     ...(await connection.getLatestBlockhash()),
    // });


    const extensions = [
        ExtensionType.TransferFeeConfig,
        ExtensionType.MetadataPointer,
    ];
    // const mintLen = getMintLen(extensions);
    const mintLen = getMintLen([ExtensionType.MetadataPointer]);

    // const mintLamports = await connection.getMinimumBalanceForRentExemption(mintLen);

    const mintLamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);

    const transferFeeConfigAuthority = Keypair.generate();
    // authority that can move tokens withheld on the mint or token accounts
const withdrawWithheldAuthority = Keypair.generate();

    const mintTransaction = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: mint.publicKey,
            space: mintLen,
            lamports: mintLamports,
            programId: TOKEN_2022_PROGRAM_ID,
        }),
        // createInitializeTransferFeeConfigInstruction(
        //     mint,
        //     transferFeeConfigAuthority.publicKey,
        //     withdrawWithheldAuthority.publicKey,
        //     600,
        //     BigInt(5_000),
        //     TOKEN_2022_PROGRAM_ID
        // ),
        createInitializeMetadataPointerInstruction(
            mint.publicKey,
            payer.publicKey,
            mint.publicKey,
            TOKEN_2022_PROGRAM_ID
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

        // add a custom field
        createUpdateFieldInstruction({
            metadata: mint.publicKey,
            updateAuthority: payer.publicKey,
            programId: TOKEN_2022_PROGRAM_ID,
            field: metadata.additionalMetadata[0][0],
            value: metadata.additionalMetadata[0][1],
        }),

        // update a field
        createUpdateFieldInstruction({
            metadata: mint.publicKey,
            updateAuthority: payer.publicKey,
            programId: TOKEN_2022_PROGRAM_ID,
            field: 'name',
            value: 'YourToken',
        }),

        // remove a field
        createRemoveKeyInstruction({
            programId: TOKEN_2022_PROGRAM_ID,
            metadata: mint.publicKey,
            updateAuthority: payer.publicKey,
            key: 'new-field',
            idempotent: true, // If false the operation will fail if the field does not exist in the metadata
        })
    );
    const sig = await sendAndConfirmTransaction(connection, mintTransaction, [payer, mint]);
    console.log('Signature:', sig);
})().catch(err => {
    console.log(err);
});