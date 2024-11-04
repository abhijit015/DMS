"use server";

import mariadb from 'mariadb';


const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  connectionLimit: 5,
});


export async function getConn() {

  try {
    const conn = await pool.getConnection();
    return conn;
  } 
  
  catch (error) {
    console.error('Error getting database connection:', error);
    throw error;
  }

}


export async function executeQuery<T = any>(
  query: string,
  values?: T[],
  connection?: mariadb.PoolConnection
) {

  let conn = connection;

  try {
    if (!conn) {
      conn = await pool.getConnection();
    }

    const results = await conn.query(query, values);
    return results;
  }
  
  catch (error) {
    console.error('Database Query Error:', error);
    throw error;
  } 
  
  finally {
    if (!connection && conn) {
      conn.release();
    }
  }

}
