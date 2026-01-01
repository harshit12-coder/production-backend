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
            res.status(500).json({ error: 'Invalid JSON returned from auth API' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to reach auth server' });
    }
});

// ==================== GET ALL CLIENTS ====================
app.get('/api/clients', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Authorization token required' });
        }

        const response = await fetch(`${API_BASE_URL}/client/api/v1/Client/GetAll?maxResultCount=1000`, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ error: 'Failed to fetch clients', details: errorText });
        }

        const data = await response.json();
        const clientsToSend = data.items || data.result?.items || data.result || data || [];
        res.status(200).json(clientsToSend);

    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
});

// ==================== PROXY: GET MO NUMBERS ====================
app.get('/proxy/meter-reports/:clientId', async (req, res) => {
    try {
        const { clientId } = req.params;
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ error: 'Authorization token required' });
        if (!clientId) return res.status(400).json({ error: 'Client ID required' });

        const response = await fetch(`${API_BASE_URL}/meterreport/api/v1/MeterReportService/GetMONumbersByClient?Id=${clientId}`, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ error: 'Failed to fetch MO numbers', details: errorText });
        }

        const data = await response.json();
        res.status(200).json(data);

    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch MO numbers' });
    }
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error Handler
app.use((err, req, res, next) => {
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    // Only startup log rakh rahe hain - no sensitive info
    console.log(`Backend running on port ${PORT}`);
});