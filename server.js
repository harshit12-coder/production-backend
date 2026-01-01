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

// CORS Configuration
app.use(cors({
    origin: function (origin, callback) {
        // Allow all origins in production (can be restricted as needed)
        callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Backend is running' });
});

// ==================== LOGIN ====================
app.post('/api/login', async (req, res) => {
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

// ==================== CLIENTS ====================
app.get('/api/clients', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'Authorization token is required' });
        }

        const response = await fetch(`${API_BASE_URL}/api/services/app/Client/GetAll`, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Abp.TenantId': '1'
            }
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (err) {
        console.error('Get clients error:', err);
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
});

// ==================== MOBY CLIENTS ====================
app.get('/api/mobyclients', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'Authorization token is required' });
        }

        const response = await fetch(`${API_BASE_URL}/api/services/app/MobyClient/GetAll`, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Abp.TenantId': '1'
            }
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (err) {
        console.error('Get moby clients error:', err);
        res.status(500).json({ error: 'Failed to fetch moby clients' });
    }
});

// ==================== GET SINGLE CLIENT ====================
app.get('/api/clients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'Authorization token is required' });
        }

        const response = await fetch(`${API_BASE_URL}/api/services/app/Client/Get?id=${id}`, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Abp.TenantId': '1'
            }
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (err) {
        console.error('Get client error:', err);
        res.status(500).json({ error: 'Failed to fetch client' });
    }
});

// ==================== CREATE CLIENT ====================
app.post('/api/clients', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'Authorization token is required' });
        }

        const response = await fetch(`${API_BASE_URL}/api/services/app/Client/Create`, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json-patch+json',
                'Abp.TenantId': '1'
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (err) {
        console.error('Create client error:', err);
        res.status(500).json({ error: 'Failed to create client' });
    }
});

// ==================== UPDATE CLIENT ====================
app.put('/api/clients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'Authorization token is required' });
        }

        const response = await fetch(`${API_BASE_URL}/api/services/app/Client/Update?id=${id}`, {
            method: 'PUT',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json-patch+json',
                'Abp.TenantId': '1'
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (err) {
        console.error('Update client error:', err);
        res.status(500).json({ error: 'Failed to update client' });
    }
});

// ==================== DELETE CLIENT ====================
app.delete('/api/clients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'Authorization token is required' });
        }

        const response = await fetch(`${API_BASE_URL}/api/services/app/Client/Delete?id=${id}`, {
            method: 'DELETE',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Abp.TenantId': '1'
            }
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (err) {
        console.error('Delete client error:', err);
        res.status(500).json({ error: 'Failed to delete client' });
    }
});

// ==================== GET CLIENT DATA ====================
// Endpoint: GET /proxy/clients
// This fetches from: GET /client/api/v1/Client/GetAll
app.get('/proxy/clients', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'Authorization token is required' });
        }

        const response = await fetch(`${CLIENT_API_BASE_URL}/client/api/v1/Client/GetAll`, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (err) {
        console.error('Get client data error:', err);
        res.status(500).json({ error: 'Failed to fetch client data', details: err.message });
    }
});

// ==================== GET METER REPORT DATA ====================
// Endpoint: GET /proxy/meter-reports/:clientId
// This fetches from: GET /meterreport/api/v1/MeterReportService/GetMONumbersByClient
app.get('/proxy/meter-reports/:clientId', async (req, res) => {
    try {
        const { clientId } = req.params;
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'Authorization token is required' });
        }

        if (!clientId) {
            return res.status(400).json({ error: 'Client ID is required' });
        }

        const response = await fetch(`${METER_REPORT_API_BASE_URL}/meterreport/api/v1/MeterReportService/GetMONumbersByClient?clientId=${clientId}`, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (err) {
        console.error('Get meter report error:', err);
        res.status(500).json({ error: 'Failed to fetch meter reports', details: err.message });
    }
});

// ==================== GET METER REPORTS FOR MULTIPLE CLIENTS ====================
// Endpoint: POST /proxy/meter-reports
// Body: { clientIds: [1, 2, 3] }
// Fetches meter reports for multiple clients concurrently
app.post('/proxy/meter-reports', async (req, res) => {
    try {
        const { clientIds } = req.body;
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'Authorization token is required' });
        }

        if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
            return res.status(400).json({ error: 'Client IDs array is required' });
        }

        // Fetch meter reports for all clients concurrently
        const reports = await Promise.all(
            clientIds.map(clientId =>
                fetch(`${METER_REPORT_API_BASE_URL}/meterreport/api/v1/MeterReportService/GetMONumbersByClient?clientId=${clientId}`, {
                    method: 'GET',
                    headers: {
                        'accept': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })
                    .then(r => r.json())
                    .then(data => ({ clientId, data }))
                    .catch(err => ({ clientId, error: err.message }))
            )
        );

        res.status(200).json({ reports });
    } catch (err) {
        console.error('Get multiple meter reports error:', err);
        res.status(500).json({ error: 'Failed to fetch meter reports', details: err.message });
    }
});

// ==================== 404 HANDLER ====================
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
    console.log(`✅ Backend is running on port ${PORT}`);
    console.log(`📝 Main API Base URL: ${API_BASE_URL}`);
    console.log(`📝 Client API Base URL: ${CLIENT_API_BASE_URL}`);
    console.log(`📝 Meter Report API Base URL: ${METER_REPORT_API_BASE_URL}`);
});
