import { UltraHonkBackend, ProofData } from '@aztec/bb.js';
import { readFileSync } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  // Load circuit bytecode
  const circuitPath = path.join(__dirname, 'target/hello_world.json');
  const circuitJson = JSON.parse(readFileSync(circuitPath, 'utf8'));
  const bytecode = circuitJson.bytecode;

  // Initialize backend
  const backend = new UltraHonkBackend(bytecode);

  // Read proof data from file
  const proofDataPath = path.join(__dirname, 'target/proof_data.json');
  const proofDataJson = JSON.parse(readFileSync(proofDataPath, 'utf8'));

  // Convert back to the expected format
  const proofData: ProofData = {
    proof: Uint8Array.from(proofDataJson.proof),
    publicInputs: proofDataJson.publicInputs
  };

  // Verify the proof
  console.log('Verifying proof...');
  const startTime = Date.now();
  const isValid = await backend.verifyProof(proofData, { keccak: true });
  const verifyTime = Date.now() - startTime;

  console.log(`Proof verification: ${isValid ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Verification completed in ${verifyTime}ms`);

  // Clean up backend to allow process to exit
  await backend.destroy();
}

main().catch(console.error);