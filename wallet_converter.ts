import bs58 from 'bs58';
import promptSync from 'prompt-sync';

const prompt = promptSync();

function base58ToWallet() {
    console.log("Enter your base58 encoded private key:");
    const base58 = prompt('');
    const wallet = bs58.decode(base58);
    console.log("Wallet format:", Array.from(wallet));
}

function walletToBase58() {
    console.log("Enter your wallet private key (comma-separated numbers):");
    const walletInput = prompt('');
    const wallet = new Uint8Array(walletInput.split(',').map((num: string) => parseInt(num.trim())));
    const base58 = bs58.encode(wallet);
    console.log("Base58 encoded:", base58);
}

console.log("Choose an option:");
console.log("1. Convert Base58 to Wallet format");
console.log("2. Convert Wallet format to Base58");

const choice = prompt('');

if (choice === '1') {
    base58ToWallet();
} else if (choice === '2') {
    walletToBase58();
} else {
    console.log("Invalid choice");
}
