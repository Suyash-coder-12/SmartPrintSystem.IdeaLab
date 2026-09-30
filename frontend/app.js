// app.js

// Variables ko select kar rahe hain DOM (Document Object Model) se
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const uploadView = document.getElementById('uploadView');
const editorView = document.getElementById('editorView');
const pdfPreview = document.getElementById('pdfPreview');
const imagePreview = document.getElementById('imagePreview');
const cancelBtn = document.getElementById('cancelBtn');
const printBtn = document.getElementById('printBtn');
const copiesInput = document.getElementById('copies');
const copyMinus = document.getElementById('copyMinus');
const copyPlus = document.getElementById('copyPlus');
const colorInputs = document.querySelectorAll('input[name="colorMode"]');
const paymentInputs = document.querySelectorAll('input[name="paymentMode"]');
const previewFileName = document.getElementById('previewFileName');
const toastContainer = document.getElementById('toastContainer');

// Set PDF.js worker path to local
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';
}

// UI Elements for Scanner (Scanner UI parts)
const scanBtnArea = document.getElementById('scanBtnArea');
const scannerView = document.getElementById('scannerView');
const closeScannerBtn = document.getElementById('closeScannerBtn');
const cameraStream = document.getElementById('cameraStream');
const captureBtn = document.getElementById('captureBtn');
const canvasCapture = document.getElementById('canvasCapture');

// Global variables document track karne ke liye
let currentFile = null;
let pageCount = 0;
let mediaStream = null;

/**
 * File Upload Logic
 * Drag & drop and click to browse for documents.
 */
// Browse button pe click karne se file input open hota hai
browseBtn.addEventListener('click', () => {
    fileInput.click();
});

    // File input change hone par (jab user file choose kar le)
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

// Drag and drop feature ke events
dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover'); // Hover effect dene ke liye class add kiya
});

dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover'); // Hover effect remove kar diya
});

dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
    }
});

/**
 * Scanner Feature Logic
 * Camera ko access karna and photo capture karna
 */

// Scan button pe click (Upload page pe)
scanBtnArea.addEventListener('click', async () => {
    uploadView.classList.add('hidden'); // Upload view chhupao
    scannerView.classList.remove('hidden'); // Scanner view dikhao

    try {
        // Camera permissions maango aur video stream start karo
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        cameraStream.srcObject = mediaStream;
    } catch (err) {
        // Agar camera nahi mila ya permission deny ho gayi
        showToast("Camera access denied or not available.", "error");
        closeScanner();
    }
});

// Scanner band karne ka function
function closeScanner() {
    scannerView.classList.add('hidden');
    uploadView.classList.remove('hidden');
    if (mediaStream) {
        // Camera ko completely stop kar dena taaki background me use na ho
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
}

// Close button on scanner
closeScannerBtn.addEventListener('click', closeScanner);

// Capture button on scanner - photo kichne ke liye
captureBtn.addEventListener('click', () => {
    if (!mediaStream) return;

    // Canvas use karke video ki current frame ko image me convert karna
    const context = canvasCapture.getContext('2d');
    canvasCapture.width = cameraStream.videoWidth;
    canvasCapture.height = cameraStream.videoHeight;
    context.drawImage(cameraStream, 0, 0, canvasCapture.width, canvasCapture.height);

    // Base64 Data URL me convert kiya image ko
    const imageDataUrl = canvasCapture.toDataURL('image/jpeg', 0.9);

    // Convert data URL to Blob (File object jaisa)
    fetch(imageDataUrl)
        .then(res => res.blob())
        .then(blob => {
            // Naya file object create kiya jo scan hua hai
            const file = new File([blob], "Scanned_Document.jpg", { type: "image/jpeg" });
            closeScanner(); // Scanner band karo
            handleFile(file); // Handle function me bhejo aage process ke liye
        });
});

/**
 * Handle File processing
 * PDF ya Image file ko analyse karke preview pane me dikhana
 */
function handleFile(file) {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    // Type validation
    if (!validTypes.includes(file.type)) {
        showToast('Invalid file format. Please upload PDF, Word, or Images.', 'error');
        return;
    }

    // Size validation (Max 50MB)
    if (file.size > 50 * 1024 * 1024) {
        showToast('File size exceeds 50MB limit.', 'error');
        return;
    }

    currentFile = file;
    previewFileName.textContent = file.name;

    // Dono previews ko default hide kardo
    pdfPreview.style.display = 'none';
    imagePreview.style.display = 'none';

    // Agar PDF hai toh Object URL bana ke iframe (embed) me daalo
    if (file.type === 'application/pdf') {
        const fileURL = URL.createObjectURL(file);
        pdfPreview.src = fileURL + "#toolbar=0&navpanes=0&scrollbar=0";
        pdfPreview.style.display = 'block';
        analyzePDF(fileURL); // Pages count nikalne ke liye function call
    }
    // Agar image (jaise scan kiya hua) hai toh img tag use karo
    else if (file.type.startsWith('image/')) {
        const fileURL = URL.createObjectURL(file);
        imagePreview.src = fileURL;
        imagePreview.style.display = 'block';

        // Image hai toh 1 hi page hoga
        pageCount = 1;
        document.getElementById('summaryPages').textContent = '1 Page';
        calculateTotal(); // Paise calculate karo
    }
    // Word Docs ya others ke liye mock data
    else {
        document.getElementById('summaryPages').textContent = 'Cannot preview (Will be converted)';
        pageCount = Math.floor(Math.random() * 5) + 1; // Dummy page count
        calculateTotal();
    }

    // View switch karo: Upload hata ke Editor dikhao
    uploadView.classList.add('hidden');
    editorView.classList.remove('hidden');
}

/**
 * PDF Analysis
 * pdf.js library ka use karke pdf ke andar kitne pages hain ye count karta hai
 */
async function analyzePDF(url) {
    try {
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        pageCount = pdf.numPages; // Number of pages set kiya
        document.getElementById('summaryPages').textContent = `${pageCount} Pages`;
        calculateTotal(); // Paise ka hisaab lagaya
    } catch (error) {
        console.error('Error analyzing PDF:', error);
        document.getElementById('summaryPages').textContent = 'Unknown (Failed to analyze)';
        pageCount = 1; // Default
        calculateTotal();
    }
}

/**
 * Price Calculation Logic
 * Copies, Pages aur Color mode ke basis pe total calculation
 */
const RATES = { monochrome: 2.00, color: 10.00 }; // Print rates rupees me

function calculateTotal() {
    if (!pageCount) return;

    // Find currently selected color mode (Color ya B&W)
    const colorMode = Array.from(colorInputs).find(radio => radio.checked).value;
    const rate = RATES[colorMode];

    const copies = parseInt(copiesInput.value) || 1; // Copy input ki value lo
    const total = pageCount * copies * rate; // Total formula

    // UI elements update karo numbers ke sath
    document.getElementById('summaryColorType').textContent = colorMode === 'color' ? 'Color' : 'B&W';
    document.getElementById('summaryCostPerPage').textContent = `₹${rate.toFixed(2)}`;
    document.getElementById('summaryCopies').textContent = copies;
    document.getElementById('summaryTotalCost').textContent = `₹${total.toFixed(2)}`;

    // Button ka text update karo Cash ya Online option check karke
    updatePrintButtonText();
}

// Payment method change hone par button text change karne ka logic
function updatePrintButtonText() {
    const paymentMode = Array.from(paymentInputs).find(radio => radio.checked).value;
    if (paymentMode === 'cash') {
        printBtn.innerHTML = `Confirm & Print (Pay Cash) <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>`;
    } else {
        printBtn.innerHTML = `Proceed to Pay Online <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>`;
    }
}

// Payment mode badalne pe update text karo
paymentInputs.forEach(input => {
    input.addEventListener('change', updatePrintButtonText);
});

// Setting change listeners (Agar setting badlegi toh paise dubara calculate honge)
colorInputs.forEach(input => {
    input.addEventListener('change', calculateTotal);
});

copiesInput.addEventListener('input', calculateTotal);

// Copy plus aur minus button ke logic
copyMinus.addEventListener('click', () => {
    if (copiesInput.value > 1) {
        copiesInput.value = parseInt(copiesInput.value) - 1;
        calculateTotal();
    }
});

copyPlus.addEventListener('click', () => {
    copiesInput.value = parseInt(copiesInput.value) + 1;
    calculateTotal();
});

/**
 * Reset & Cancel
 * Discard button click karne pe wapas purani state me lana
 */
cancelBtn.addEventListener('click', () => {
    currentFile = null;
    pageCount = 0;
    // Previews hatao
    pdfPreview.src = '';
    imagePreview.src = '';
    // Form default pe set karo
    document.getElementById('printSettingsForm').reset();

    // View badlo
    editorView.classList.add('hidden');
    uploadView.classList.remove('hidden');
});

/**
 * Print Submission Logic
 * Jab final 'Proceed' button click hoga
 */
printBtn.addEventListener('click', async () => {
    if (!currentFile) {
        showToast('Please select a file first.', 'error');
        return;
    }

    const paymentMode = Array.from(paymentInputs).find(radio => radio.checked).value;
    const progressOverlay = document.getElementById('progressOverlay');
    const statusText = document.getElementById('statusText');
    const progressFill = document.getElementById('progressFill');

    // Loading overlay dikhao
    progressOverlay.classList.remove('hidden');
    progressFill.style.width = '10%';
    statusText.textContent = paymentMode === 'cash' ? 'Uploading document...' : 'Initializing payment & uploading...';

    try {
        // 1. Upload the file to the backend
        const formData = new FormData();
        formData.append('document', currentFile);
        
        const uploadRes = await fetch('http://localhost:5000/api/upload', {
            method: 'POST',
            body: formData
        });

        if (!uploadRes.ok) throw new Error('Upload failed');
        const uploadData = await uploadRes.json();
        
        progressFill.style.width = '60%';
        statusText.textContent = 'Queueing print job...';

        // 2. Dispatch the print job
        const shopIdInput = document.getElementById('activeShopId');
        const shopId = shopIdInput ? shopIdInput.value : 'default-shop';
        
        const printSettings = {
            copies: parseInt(copiesInput.value) || 1,
            colorMode: Array.from(colorInputs).find(radio => radio.checked).value,
            paymentMode: paymentMode
        };

        const printRes = await fetch('http://localhost:5000/api/print', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                shopId,
                url: uploadData.url,
                filename: uploadData.filename,
                printSettings
            })
        });

        if (!printRes.ok) throw new Error('Failed to queue print job');
        
        progressFill.style.width = '100%';
        statusText.textContent = paymentMode === 'cash' ? 'Print job sent successfully! Collect your print.' : 'Payment Success! Printing your document...';

        setTimeout(() => {
            progressOverlay.classList.add('hidden');
            showToast(paymentMode === 'cash' ? 'Job Sent to Printer successfully! Pay at counter.' : 'Payment Successful & Printed!', 'success');
            // Form reset and back to upload
            cancelBtn.click();
        }, 1500);

    } catch (error) {
        console.error(error);
        progressOverlay.classList.add('hidden');
        showToast('Error uploading document. Please try again.', 'error');
    }
});

/**
 * Helper: Toast Notifications
 * Chote pop-ups error ya success batane ke liye
 */
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    // Type check karke icon set kiya
    const icon = type === 'success'
        ? `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
        : `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

    toast.innerHTML = `${icon} <span>${message}</span>`;
    toastContainer.appendChild(toast);

    // Thodi der me toast ko automatic hata dena
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(100px)';
        setTimeout(() => toast.remove(), 300); // DOM se delete 300ms baad animation khtm hone pe
    }, 4000);
}
