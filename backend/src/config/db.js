import mysql from 'mysql2/promise';
import dotenv, { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// ========================================
// Get __dirname in ES modules
// ========================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========================================
// Database Connection Configuration
// ======================================== 
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'defaultdb',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 30000,      // 30 seconds timeout for initial connection
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};



// ✅ Add SSL configuration for cloud databases (Aiven, AWS RDS, etc.)
if (process.env.DB_SSL_MODE === 'REQUIRED') {
    const caCertPath = path.join(__dirname, '../../ca-certificate.pem');

    // Check if CA certificate file exists
    if (fs.existsSync(caCertPath)) {
        dbConfig.ssl = {
            ca: fs.readFileSync(caCertPath),
            rejectUnauthorized: true
        };

        console.log('config database: ', dbConfig);
        console.log('🔒 Database SSL enabled with CA certificate');
        console.log(`📄 CA cert: ${caCertPath}`);
    } else {
        // Fallback: Try without CA cert (some cloud providers work without it)
        dbConfig.ssl = {
            rejectUnauthorized: false // Less secure but works
        };
        console.log('⚠️  CA certificate not found, using SSL without verification');
        console.log(`   Expected at: ${caCertPath}`);
        console.log('   Download from Aiven console or paste content into ca-certificate.pem');
    }
} else {
    console.log('🔓 Database SSL disabled (local mode)');
}

export const pool = mysql.createPool(dbConfig);

// Test connection on startup
pool.getConnection()
    .then(connection => {
        console.log('✅ Database connected successfully!');
        console.log(`📍 Host: ${dbConfig.host}`);
        console.log(`📊 Database: ${dbConfig.database}`);
        connection.release();
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err.message);
        console.error('Check your .env configuration!');
    });

export async function query(sql, params) {
    const [rows] = await pool.execute(sql, params);
    return rows;
}
