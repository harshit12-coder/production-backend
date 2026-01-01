import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.kushal.kimbal.io';
const CLIENT_API_BASE_URL = process.env.CLIENT_API_BASE_URL || 'https://client-api.kushal.kimbal.io';
const METER_REPORT_API_BASE_URL = process.env.METER_REPORT_API_BASE_URL || 'https://meterreport-api.kushal.kimbal.io';

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

// ==================== GET ALL CLIENTS (FIXED WITH PROPER ERROR HANDLING) ====================
app.get('/api/clients', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Authorization token required' });
        }

        console.log("Fetching clients from main API...");

        const response = await fetch(`${API_BASE_URL}/api/services/app/Client/GetAll`, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Abp.TenantId': '1'
            }
        });

        console.log("Upstream clients API status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Upstream clients API error:", response.status, errorText);
            return res.status(response.status).json({
                error: 'Upstream API failed',
                status: response.status,
                details: errorText
            });
        }

        const data = await response.json();
        console.log("Clients fetched successfully. Count:", data.result?.length || 'unknown');
        res.status(200).json(data);

    } catch (err) {
        console.error('Get clients critical error:', err.message);
        res.status(500).json({
            error: 'Failed to fetch clients',
            details: err.message
        });
    }
});

// ==================== GET ALL MOBY CLIENTS (FIXED) ====================
app.get('/api/mobyclients', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Authorization token required' });
        }

        const response = await fetch(`${API_BASE_URL}/api/services/app/MobyClient/GetAll`, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Abp.TenantId': '1'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Moby clients upstream error:", response.status, errorText);
            return res.status(response.status).json({ error: 'Upstream failed', details: errorText });
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (err) {
        console.error('Get moby clients error:', err);
        res.status(500).json({ error: 'Failed to fetch moby clients' });
    }
});

// ==================== GET SINGLE CLIENT (FIXED) ====================
app.get('/api/clients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Authorization token required' });
        }

        const response = await fetch(`${API_BASE_URL}/api/services/app/Client/Get?id=${id}`, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Abp.TenantId': '1'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Single client upstream error:", response.status, errorText);
            return res.status(response.status).json({ error: 'Upstream failed', details: errorText });
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (err) {
        console.error('Get client error:', err);
        res.status(500).json({ error: 'Failed to fetch client' });
    }
});

// ==================== PROXY: GET CLIENT DATA ====================
app.get('/proxy/clients', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ error: 'Authorization token required' });

        const response = await fetch(`${CLIENT_API_BASE_URL}/client/api/v1/Client/GetAll`, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Proxy clients upstream error:", response.status, errorText);
            return res.status(response.status).json({ error: 'Proxy upstream failed', details: errorText });
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (err) {
        console.error('Proxy clients error:', err);
        res.status(500).json({ error: 'Failed to fetch client data', details: err.message });
    }
});

// ==================== PROXY: GET METER REPORTS FOR ONE CLIENT ====================
app.get('/proxy/meter-reports/:clientId', async (req, res) => {
    try {
        const { clientId } = req.params;
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ error: 'Authorization token required' });
        if (!clientId) return res.status(400).json({ error: 'Client ID required' });

        const response = await fetch(`${METER_REPORT_API_BASE_URL}/meterreport/api/v1/MeterReportService/GetMONumbersByClient?clientId=${clientId}`, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Meter report upstream error:", response.status, errorText);
            return res.status(response.status).json({ error: 'Meter report upstream failed', details: errorText });
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (err) {
        console.error('Meter report error:', err);
        res.status(500).json({ error: 'Failed to fetch meter reports', details: err.message });
    }
});

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
    console.log(`Main API: ${API_BASE_URL}`);
    console.log(`Client API: ${CLIENT_API_BASE_URL}`);
    console.log(`Meter Report API: ${METER_REPORT_API_BASE_URL}`);
});