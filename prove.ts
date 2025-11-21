import { UltraHonkBackend, ProofData } from '@aztec/bb.js';
import { readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  // Load circuit bytecode (from Noir compiler output)
  const startTime = Date.now();
  const circuitPath = path.join(__dirname, 'target/hello_world.json');
  const circuitJson = JSON.parse(readFileSync(circuitPath, 'utf8'));
  const bytecode = circuitJson.bytecode;

  // Load witness data
  const witnessPath = path.join(__dirname, 'target/hello_world.gz');
  const witnessBuffer = readFileSync(witnessPath);

  // Initialize backend
  const backend = new UltraHonkBackend(bytecode);

  // Generate proof with Keccak for EVM verification
  const proofData: ProofData = await backend.generateProof(witnessBuffer, {
    keccak: true
  });

  const provingTime = Date.now() - startTime;
  console.log(`Proof generated in ${provingTime}ms`);
  console.log(`Proof size: ${proofData.proof.length} bytes`);
  console.log(`Public inputs: ${proofData.publicInputs.length}`);

  // Write proof data to file
  const proofOutputPath = path.join(__dirname, 'target/proof_data.json');
  writeFileSync(proofOutputPath, JSON.stringify({
    proof: Array.from(proofData.proof),
    publicInputs: proofData.publicInputs.map(input => input.toString())
  }, null, 2));
  console.log(`Proof data written to ${proofOutputPath}`);

  // Clean up backend to allow process to exit
  await backend.destroy();
}

main().catch(console.error);