import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.kushal.kimbal.io';

// Secure CORS
const allowedOrigins = [
    'https://smart-hourly-portal.netlify.app',
    'http://localhost:3000',
    'http://localhost:5173'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS']
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Backend is running' });
});

// ==================== LOGIN V2 ====================
app.post('/api/loginV2', async (req, res) => {
    try {
        const { userNameOrEmailAddress, password } = req.body;

        if (!userNameOrEmailAddress || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const response = await fetch(`${API_BASE_URL}/api/TokenAuth/Authenticate`, {
            method: 'POST',
            headers: {
                'accept': 'text/plain',
                'Content-Type': 'application/json-patch+json',
                'Abp.TenantId': '1'
            },
            body: JSON.stringify({
                userNameOrEmailAddress,
                password,
                rememberClient: false
            })
        });

        const text = await response.text();
        try {
            const data = JSON.parse(text);
            res.status(response.status).json(data);
        } catch {
            console.error('Failed to parse JSON from upstream:', text);
            res.status(500).json({ error: 'Invalid JSON returned from auth API' });
        }
    } catch (err) {
        console.error('Login proxy error:', err);
        res.status(500).json({ error: 'Failed to reach auth server' });
    }
});

// ==================== GET ALL CLIENTS (CORRECT PUBLIC ENDPOINT FROM SWAGGER) ====================
// ==================== GET ALL CLIENTS (FORCE FULL LIST - BYPASS PAGINATION) ====================
app.get('/api/clients', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Authorization token required' });
        }

        console.log("Fetching ALL clients - bypassing pagination...");

        // Force full list with maxResultCount=1000
        const url = `${API_BASE_URL}/client/api/v1/Client/GetAll?maxResultCount=1000`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        console.log("Full clients API status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Full clients API error:", response.status, errorText);
            return res.status(response.status).json({ error: 'Failed to fetch clients', details: errorText });
        }

        const data = await response.json();
        
        // Agar response mein items + totalCount hai, toh items return kar do (full hone chahiye ab)
        const clientsToSend = data.items || data.result?.items || data.result || data || [];
        
        console.log(`Successfully fetched ${clientsToSend.length} clients (forced full list)`);
        
        res.status(200).json(clientsToSend);

    } catch (err) {
        console.error('Get clients error:', err.message);
        res.status(500).json({ error: 'Failed to fetch clients', details: err.message });
    }
});

// ==================== PROXY: GET MO NUMBERS (CORRECT PUBLIC ENDPOINT FROM SWAGGER) ====================
app.get('/proxy/meter-reports/:clientId', async (req, res) => {
    try {
        const { clientId } = req.params;
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ error: 'Authorization token required' });
        if (!clientId) return res.status(400).json({ error: 'Client ID required' });

        console.log(`Fetching MO numbers for client ID: ${clientId}`);

        const response = await fetch(`${API_BASE_URL}/meterreport/api/v1/MeterReportService/GetMONumbersByClient?Id=${clientId}`, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        console.log("MO API status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("MO API error:", response.status, errorText);
            return res.status(response.status).json({ error: 'Failed to fetch MO numbers', details: errorText });
        }

        const data = await response.json();
        console.log("MO numbers loaded:", data.length || data.result?.length || 0);
        res.status(200).json(data);

    } catch (err) {
        console.error('MO fetch error:', err.message);
        res.status(500).json({ error: 'Failed to fetch MO numbers', details: err.message });
    }
});

// Optional other routes (mobyclients, single client etc.) - keep if needed, or remove to clean
// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`✅ Backend running on port ${PORT}`);
    console.log(`API Base: ${API_BASE_URL}`);
});