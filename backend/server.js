const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve the frontend UI
app.use(express.static(path.join(__dirname, '../frontend')));

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// Setup Multer for file uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ 
    storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// -- API ENDPOINTS --

// 1. File Upload Endpoint
app.post('/api/upload', upload.single('document'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Construct public URL for the receiver to download
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    console.log(`File uploaded: ${fileUrl}`);
    
    res.json({ url: fileUrl, filename: req.file.originalname });
});

// -- WEBSOCKETS (SOCKET.IO) --

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // The Shop's Windows PC connects and registers itself
    socket.on('register-shop', (shopId) => {
        socket.join(shopId);
        console.log(`Shop PC registered: [${shopId}] on socket ${socket.id}`);
    });

    // The Frontend Web UI triggers a print job
    socket.on('trigger-print', (data) => {
        console.log('Received print job from frontend:', data);
        
        const targetShop = data.shopId || 'default-shop'; 
        
        // Forward the print job to the specific shop's PC
        io.to(targetShop).emit('print-job', {
            url: data.url,
            filename: data.filename,
            printSettings: data.printSettings
        });
        
        console.log(`Dispatched print command to shop: ${targetShop}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`-----------------------------------------`);
    console.log(`🚀 Smart Print Backend running on port ${PORT}`);
    console.log(`📡 WebSocket server ready`);
    console.log(`📂 Uploads directory ready`);
    console.log(`-----------------------------------------`);
});
