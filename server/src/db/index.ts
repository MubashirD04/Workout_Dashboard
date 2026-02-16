import { Pool, types } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Fix for date shifting: Return DATE OID 1082 as a string
types.setTypeParser(1082, (val) => val);

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
export default pool;
