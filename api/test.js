import fs from 'fs';
import mysql from 'mysql2';
import { exit } from 'process';

const SQLDATA = JSON.parse(
    fs.readFileSync('cfg/sqlcfg.json')
);

const sql = mysql.createConnection(
    {
        multipleStatements: true,
        ...SQLDATA
    }
);



sql.query(
    `SELECT`
)