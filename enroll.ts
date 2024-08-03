import { Connection, Keypair, SystemProgram, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";
import { Program, Wallet, AnchorProvider, Address } from "@project-serum/anchor";
import { WbaPrereq, IDL } from "./programs/wba_prereq";
import wallet from "./wba-wallet.json";

const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
const github = Buffer.from("windswept321", "utf8");

const provider = new AnchorProvider(connection, new Wallet(keypair), { commitment: "confirmed" });

const program = new Program<WbaPrereq>(IDL, "WBAQSygkwMox2VuWKU133NxFrpDZUBdvSBeaBEue2Jq" as Address, provider);

const enrollment_seeds = [Buffer.from("prereq"), keypair.publicKey.toBuffer()];
const [enrollment_key, _bump] = PublicKey.findProgramAddressSync(enrollment_seeds, program.programId);

(async () => {
    try {
        // Check which network we're on
        const genesisHash = await connection.getGenesisHash();
        console.log("Current network:", connection.rpcEndpoint);
        console.log("Genesis hash:", genesisHash);

        // Log wallet address and balance
        console.log("Wallet address:", keypair.publicKey.toString());
        const balance = await connection.getBalance(keypair.publicKey);
        console.log("Wallet balance:", balance / LAMPORTS_PER_SOL, "SOL");

        // Check if the account exists
        const accountInfo = await connection.getAccountInfo(keypair.publicKey);
        console.log("Account exists:", accountInfo !== null);

        if (accountInfo === null) {
            console.log("Account does not exist. Attempting to airdrop 1 SOL...");
            const signature = await connection.requestAirdrop(keypair.publicKey, LAMPORTS_PER_SOL);
            await connection.confirmTransaction(signature);
            const newBalance = await connection.getBalance(keypair.publicKey);
            console.log("New balance after airdrop:", newBalance / LAMPORTS_PER_SOL, "SOL");
        }

        // Check if balance is too low
        if (balance < 0.01 * LAMPORTS_PER_SOL) {
            throw new Error("Not enough SOL to pay for transaction fees. Please airdrop some SOL to your wallet.");
        }

        // Log PDA
        console.log("Enrollment PDA:", enrollment_key.toString());

        // Execute our enrollment transaction
        const txhash = await program.methods
            .complete(github)
            .accounts({
                signer: keypair.publicKey,
                prereq: enrollment_key,
                systemProgram: SystemProgram.programId,
            })
            .signers([keypair])
            .rpc();
        
        console.log(`Success! Check out your TX here: https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
    } catch (e) {
        console.error(`Oops, something went wrong: ${e}`);
        if (e && typeof e === 'object' && 'logs' in e) {
            console.error('Error logs:', (e as any).logs);
        }
    }
})();