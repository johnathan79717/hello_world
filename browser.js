import { UltraHonkBackend } from '@aztec/bb.js';

let proofData = null;
let backend = null;

const output = document.getElementById('output');
const proveBtn = document.getElementById('proveBtn');
const verifyBtn = document.getElementById('verifyBtn');

function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const span = document.createElement('span');
    span.className = type;
    span.textContent = `[${timestamp}] ${message}`;
    output.appendChild(span);
    output.appendChild(document.createTextNode('\n'));
    output.scrollTop = output.scrollHeight;
}

async function loadCircuitData() {
    try {
        // Load circuit bytecode
        const circuitResponse = await fetch('./target/hello_world.json');
        const circuitJson = await circuitResponse.json();
        const bytecode = circuitJson.bytecode;

        // Load witness data
        const witnessResponse = await fetch('./target/hello_world.gz');
        const witnessBuffer = await witnessResponse.arrayBuffer();

        return { bytecode, witnessBuffer: new Uint8Array(witnessBuffer) };
    } catch (error) {
        log(`Error loading circuit data: ${error.message}`, 'error');
        throw error;
    }
}

proveBtn.addEventListener('click', async () => {
    try {
        proveBtn.disabled = true;
        output.textContent = '';

        log('Loading circuit data...');

        const { bytecode, witnessBuffer } = await loadCircuitData();
        log('Circuit data loaded successfully');

        log('Initializing backend...');

        // Add logger to see internal bb.js messages
        const bbLogger = (msg) => {
            console.log('[BB.js]', msg);
            log(`[BB.js] ${msg}`);
        };

        backend = new UltraHonkBackend(bytecode, {
            threads: 'auto',
            logger: bbLogger
        });
        log('Backend initialized');
        log(`Using ${navigator.hardwareConcurrency || 'unknown'} CPU cores`);

        // Check if SharedArrayBuffer is available
        if (typeof SharedArrayBuffer === 'undefined') {
            log('WARNING: SharedArrayBuffer not available - threading disabled!', 'error');
            log('This will cause very slow proof generation', 'error');
        } else {
            log('SharedArrayBuffer available - threading enabled', 'success');
        }

        log('Generating proof (this may take 30-60 seconds in the browser)...');
        const startTime = Date.now();

        // Log progress every 5 seconds
        const progressInterval = setInterval(() => {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
            log(`Still generating proof... ${elapsed}s elapsed`);
        }, 5000);

        proofData = await backend.generateProof(witnessBuffer, { keccak: true });
        clearInterval(progressInterval);
        const provingTime = Date.now() - startTime;

        log(`Proof generated in ${provingTime}ms`, 'success');
        log(`Proof size: ${proofData.proof.length} bytes`);
        log(`Public inputs: ${proofData.publicInputs.length}`);

        verifyBtn.disabled = false;
    } catch (error) {
        log(`Error: ${error.message}`, 'error');
        console.error(error);
    } finally {
        proveBtn.disabled = false;
    }
});

verifyBtn.addEventListener('click', async () => {
    if (!proofData || !backend) {
        log('No proof data available. Generate a proof first.', 'error');
        return;
    }

    try {
        verifyBtn.disabled = true;
        log('Verifying proof...');

        const startTime = Date.now();
        const isValid = await backend.verifyProof(proofData, { keccak: true });
        const verifyTime = Date.now() - startTime;

        log(`Proof verification: ${isValid ? 'SUCCESS' : 'FAILED'}`, isValid ? 'success' : 'error');
        log(`Verification completed in ${verifyTime}ms`);
    } catch (error) {
        log(`Error: ${error.message}`, 'error');
        console.error(error);
    } finally {
        verifyBtn.disabled = false;
    }
});

log('Ready to generate proof...');
