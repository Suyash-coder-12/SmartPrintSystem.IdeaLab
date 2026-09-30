const uploadView = document.getElementById('uploadView');
const editorView = document.getElementById('editorView');
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');

// Settings Elements
const previewFileName = document.getElementById('previewFileName');
const pdfPreview = document.getElementById('pdfPreview');
const cancelBtn = document.getElementById('cancelBtn');
const printBtn = document.getElementById('printBtn');
const progressOverlay = document.getElementById('progressOverlay');
const progressFill = document.getElementById('progressFill');
const statusText = document.getElementById('statusText');
const toastContainer = document.getElementById('toastContainer');

// Form Elements
const copyMinus = document.getElementById('copyMinus');
const copyPlus = document.getElementById('copyPlus');
const copiesInput = document.getElementById('copies');
const colorModeRadios = document.getElementsByName('colorMode');

// Summary Elements
const summaryPages = document.getElementById('summaryPages');
const summaryColorType = document.getElementById('summaryColorType');
const summaryCostPerPage = document.getElementById('summaryCostPerPage');
const summaryCopies = document.getElementById('summaryCopies');
const summaryTotalCost = document.getElementById('summaryTotalCost');

// Pricing Constants
const COST_BW = 5.00; // ₹5 per page
const COST_COLOR = 5.00; // ₹5 per page

let selectedFile = null;
let fileObjectUrl = null;
let totalPdfPages = 0;

// Setup PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

// Parse URL Parameters for Shop Config
const urlParams = new URLSearchParams(window.location.search);
const SHOP_ID = urlParams.get('shop') || 'SHOP_1234';
const ENCRYPTION_KEY = urlParams.get('key') || 'SuperSecretKey';

// Connect to Backend WebSocket safely
let socket = null;
const BACKEND_URL = window.location.hostname.includes('localhost') || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000' 
    : window.location.origin;

try {
    if (typeof io !== 'undefined') {
        socket = io(BACKEND_URL);
        socket.on('connect', () => {
            console.log('Connected to print server via Socket.io');
        });
    } else {
        console.warn('Socket.io failed to load. Running in offline/UI-only mode.');
    }
} catch (e) {
    console.error('Socket connection error:', e);
}

// -- Toast Notification System --
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '';
    if(type === 'success') icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--success)"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    else if(type === 'error') icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--error)"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    else icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--primary)"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;

    toast.innerHTML = `${icon} <span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastFadeOut 0.4s forwards';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// -- Upload Logic --
browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
});

dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length) handleFileSelection(e.dataTransfer.files[0]);
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleFileSelection(e.target.files[0]);
});

async function handleFileSelection(file) {
    if(file.size > 50 * 1024 * 1024) {
        showToast('File is too large. Max 50MB.', 'error');
        return;
    }
    
    selectedFile = file;
    
    // Create object URL for native browser preview
    if(fileObjectUrl) URL.revokeObjectURL(fileObjectUrl);
    fileObjectUrl = URL.createObjectURL(file);
    
    previewFileName.textContent = file.name;
    pdfPreview.src = fileObjectUrl;

    // Transition UI
    uploadView.classList.add('hidden');
    editorView.classList.remove('hidden');
    
    showToast('File loaded successfully.', 'success');
    
    // Parse PDF to get page count
    await extractPdfInfo(file);
}

async function extractPdfInfo(file) {
    if (file.type !== 'application/pdf') {
        totalPdfPages = 1;
        summaryPages.textContent = "1 (Estimated)";
        updatePricing();
        return;
    }
    
    summaryPages.textContent = "Analyzing...";
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        totalPdfPages = pdf.numPages;
        summaryPages.textContent = totalPdfPages;
        updatePricing();
    } catch (e) {
        console.error("PDF parsing error", e);
        summaryPages.textContent = "1 (Unknown)";
        totalPdfPages = 1; // Fallback
        updatePricing();
    }
}

// -- Form Logic & Pricing --
function updatePricing() {
    const copies = parseInt(copiesInput.value) || 1;
    const isColor = document.getElementById('color').checked;
    
    const costPerPage = isColor ? COST_COLOR : COST_BW;
    summaryColorType.textContent = isColor ? 'Color' : 'B&W';
    summaryCostPerPage.textContent = `₹${costPerPage.toFixed(2)}`;
    summaryCopies.textContent = copies;
    
    if (totalPdfPages > 0) {
        const total = totalPdfPages * costPerPage * copies;
        summaryTotalCost.textContent = `₹${total.toFixed(2)}`;
    } else {
        summaryTotalCost.textContent = "N/A";
    }
}

copyMinus.addEventListener('click', () => {
    let val = parseInt(copiesInput.value) || 1;
    if(val > 1) { copiesInput.value = val - 1; updatePricing(); }
});
copyPlus.addEventListener('click', () => {
    let val = parseInt(copiesInput.value) || 1;
    if(val < 100) { copiesInput.value = val + 1; updatePricing(); }
});
copiesInput.addEventListener('input', updatePricing);
colorModeRadios.forEach(radio => radio.addEventListener('change', updatePricing));

cancelBtn.addEventListener('click', () => {
    selectedFile = null;
    totalPdfPages = 0;
    if(fileObjectUrl) URL.revokeObjectURL(fileObjectUrl);
    pdfPreview.src = "";
    editorView.classList.add('hidden');
    uploadView.classList.remove('hidden');
    fileInput.value = '';
    copiesInput.value = 1;
    document.getElementById('color').checked = true;
    updatePricing();
});

// -- E2E Encryption (AES-256-CBC via Web Crypto API) --
async function encryptFile(file, password) {
    const fileBuffer = await file.arrayBuffer();
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey("raw", enc.encode(password), {name: "PBKDF2"}, false, ["deriveBits", "deriveKey"]);
    const salt = enc.encode("QRPrintSalt2026!"); // 16 bytes
    const key = await window.crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
        keyMaterial,
        { name: "AES-CBC", length: 256 },
        true,
        ["encrypt"]
    );
    const iv = window.crypto.getRandomValues(new Uint8Array(16));
    const encryptedContent = await window.crypto.subtle.encrypt({ name: "AES-CBC", iv: iv }, key, fileBuffer);
    
    const finalData = new Uint8Array(iv.length + encryptedContent.byteLength);
    finalData.set(iv, 0);
    finalData.set(new Uint8Array(encryptedContent), iv.length);
    
    return new Blob([finalData], { type: 'application/octet-stream' });
}

// -- Print Action --
printBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    // Gather user preferences
    const settings = {
        copies: parseInt(copiesInput.value) || 1,
        monochrome: document.getElementById('bw').checked,
        orientation: document.getElementById('landscape').checked ? 'landscape' : 'portrait',
        paperSize: document.getElementById('paperSize').value,
        sides: document.getElementById('sides').value,
        pages: document.getElementById('pageRange').value.trim()
    };

    progressOverlay.classList.remove('hidden');
    statusText.textContent = 'Uploading to Server...';
    let progress = 0;
    
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 95) progress = 95;
        progressFill.style.width = `${progress}%`;
    }, 200);

    try {
        statusText.textContent = 'Encrypting Document (E2E)...';
        const encryptedBlob = await encryptFile(selectedFile, ENCRYPTION_KEY);
        const encryptedFile = new File([encryptedBlob], selectedFile.name + '.enc', { type: 'application/octet-stream' });

        // ACTUAL UPLOAD
        statusText.textContent = 'Uploading Encrypted File...';
        const formData = new FormData();
        formData.append('document', encryptedFile);

        const response = await fetch(`${BACKEND_URL}/api/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Upload failed');
        
        const result = await response.json();
        
        clearInterval(interval);
        progressFill.style.width = `100%`;
        statusText.textContent = 'Dispatching Print Job...';

        const printPayload = {
            shopId: SHOP_ID,
            url: result.url,
            filename: result.filename,
            printSettings: settings
        };

        const printResponse = await fetch(`${BACKEND_URL}/api/print`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(printPayload)
        });

        if (!printResponse.ok) {
            throw new Error(`Print trigger failed: ${printResponse.statusText}`);
        }

        setTimeout(() => {
            document.querySelector('.spinner').style.display = 'none';
            statusText.textContent = 'Order Submitted!';
            statusText.style.color = 'var(--success)';
            
            showToast('Document sent to printer securely.', 'success');
            
            setTimeout(() => {
                cancelBtn.click(); // Reset UI
                progressOverlay.classList.add('hidden');
                document.querySelector('.spinner').style.display = 'block';
                statusText.style.color = 'var(--text-main)';
                progressFill.style.width = '0%';
            }, 2000);
            
        }, 1000);

    } catch (error) {
        clearInterval(interval);
        console.error('Error sending print job', error);
        statusText.textContent = `Failed to process order: ${error.message}`;
        statusText.style.color = 'var(--error)'; 
        showToast(`Failed: ${error.message}`, 'error');
        
        setTimeout(() => {
            progressOverlay.classList.add('hidden');
            statusText.style.color = 'var(--text-main)';
            progressFill.style.width = '0%';
        }, 2000);
    }
});
