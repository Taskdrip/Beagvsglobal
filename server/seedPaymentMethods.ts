// Seed script to add default payment methods
import { db } from "./db";
import { paymentMethods } from "@shared/schema";

const defaultPaymentMethods = [
  {
    name: "Bank Transfer",
    type: "BANK_TRANSFER",
    currency: "USD",
    network: null,
    details: {
      bankName: "RealShipEX Bank",
      accountNumber: "1234567890",
      routingNumber: "021000021",
      accountName: "RealShipEX LLC"
    },
    instructions: "Transfer funds to the bank account above. Include your transaction ID in the payment memo.",
    isActive: true
  },
  {
    name: "PI Network",
    type: "CRYPTO",
    currency: "PI",
    network: "PI_MAINNET",
    details: {
      walletAddress: "GA7V2G5L4P3G5YWX4E3L2OYR5F7K6H5J5E2B6N8L4Y9R2T1A8K3D7S5V"
    },
    instructions: "Send PI coins to the wallet address above using your Pi Wallet app.",
    isActive: true
  },
  {
    name: "USDT (Tron Network)",
    type: "CRYPTO",
    currency: "USDT",
    network: "TRON",
    details: {
      walletAddress: "TQn9Y2khEfEmt7c9J5EHLhGCwLkBtcR8hn"
    },
    instructions: "Send USDT TRC-20 tokens to the Tron wallet address above.",
    isActive: true
  },
  {
    name: "USDT (TON Network)",
    type: "CRYPTO",
    currency: "USDT",
    network: "TON",
    details: {
      walletAddress: "0:a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0"
    },
    instructions: "Send USDT tokens to the TON wallet address above.",
    isActive: true
  },
  {
    name: "USDT (BNB Smart Chain)",
    type: "CRYPTO",
    currency: "USDT",
    network: "BNB",
    details: {
      walletAddress: "0x742d35Cc6C468C7a6E8A8BeC4e3D62f12F4B9Cd3"
    },
    instructions: "Send USDT BEP-20 tokens to the BNB Smart Chain wallet address above.",
    isActive: true
  },
  {
    name: "USDT (Solana)",
    type: "CRYPTO",
    currency: "USDT",
    network: "SOL",
    details: {
      walletAddress: "7xKXtg2CW87d97TXJSDpbD5FhR3vHR1c98R7Q6Y8pLjk"
    },
    instructions: "Send USDT SPL tokens to the Solana wallet address above.",
    isActive: true
  },
  {
    name: "USDT (Avalanche)",
    type: "CRYPTO",
    currency: "USDT",
    network: "AVAX",
    details: {
      walletAddress: "0x742d35Cc6C468C7a6E8A8BeC4e3D62f12F4B9Cd3"
    },
    instructions: "Send USDT tokens to the Avalanche C-Chain wallet address above.",
    isActive: true
  }
];

export async function seedPaymentMethods() {
  console.log("Seeding payment methods...");
  
  try {
    for (const method of defaultPaymentMethods) {
      await db.insert(paymentMethods).values(method).onConflictDoNothing();
    }
    console.log("Payment methods seeded successfully!");
  } catch (error) {
    console.error("Error seeding payment methods:", error);
  }
}

// Run the seeding
seedPaymentMethods().then(() => process.exit(0)).catch(console.error);