import "dotenv/config";
import { createQRCode } from "../services/qrService";

async function run() {
  try {
    const token = await createQRCode();
    console.log("QR token created:");
    console.log(token);
    process.exit(0);
  } catch (err) {
    console.error("Failed to create QR token", err);
    process.exit(1);
  }
}

run();
