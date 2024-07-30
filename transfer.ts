import { Transaction, SystemProgram, Connection, Keypair, LAMPORTS_PER_SOL, sendAndConfirmTransaction, PublicKey } from "@solana/web3.js"
import fs from 'fs';

console.log("Script started");

let wallet;
try {
  wallet = JSON.parse(fs.readFileSync('./dev-wallet.json', 'utf-8'));
  console.log("Wallet loaded successfully");
} catch (error) {
  console.error("Error loading wallet:", error);
  process.exit(1);
}

// Import our dev wallet keypair from the wallet file
const from = Keypair.fromSecretKey(new Uint8Array(wallet));

console.log("Wallet public key:", from.publicKey.toBase58());

// Define our WBA public key
const to = new PublicKey("J14oYTHCNaDvKat2C2BHAVUEdRNZtdnga47eK9hYQxAr");

//Create a Solana devnet connection
const connection = new Connection("https://api.devnet.solana.com");

(async () => {
    try {
        // Get balance of dev wallet
        const balance = await connection.getBalance(from.publicKey);
        console.log(`Current balance: ${balance / LAMPORTS_PER_SOL} SOL`);

        // Create a test transaction to calculate fees
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: from.publicKey,
                toPubkey: to,
                lamports: balance,
            })
        );
        transaction.recentBlockhash = (await connection.getLatestBlockhash('confirmed')).blockhash;
        transaction.feePayer = from.publicKey;

        // Calculate exact fee rate to transfer entire SOL amount out of account minus fees
        const fee = (await connection.getFeeForMessage(transaction.compileMessage(), 'confirmed')).value || 0;
        console.log(`Fee: ${fee / LAMPORTS_PER_SOL} SOL`);

        // Remove our transfer instruction to replace it
        transaction.instructions.pop();

        // Now add the instruction back with correct amount of lamports
        transaction.add(
            SystemProgram.transfer({
                fromPubkey: from.publicKey,
                toPubkey: to,
                lamports: balance - fee,
            })
        );

        // Sign transaction, broadcast, and confirm
        const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [from]
        );
        console.log(`Success! Check out your TX here: 
        https://explorer.solana.com/tx/${signature}?cluster=devnet`);

        // Check final balances
        const finalFromBalance = await connection.getBalance(from.publicKey);
        const finalToBalance = await connection.getBalance(to);
        
        console.log(`Final balance of sender: ${finalFromBalance / LAMPORTS_PER_SOL} SOL`);
        console.log(`Final balance of recipient: ${finalToBalance / LAMPORTS_PER_SOL} SOL`);
        console.log(`Amount transferred: ${(balance - fee) / LAMPORTS_PER_SOL} SOL`);

    } catch(e) {
        console.error(`Oops, something went wrong: ${e}`)
    }
    console.log("Script ended");
})();