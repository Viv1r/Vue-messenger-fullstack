import fs from 'fs';
import mysql from 'mysql2/promise';
import { exit } from 'process';

const SQLDATA = JSON.parse(
    fs.readFileSync('cfg/sqlcfg.json')
);

const sql = mysql.createPool(
    {
        ...SQLDATA
    }
);

(async () => {
    const [rows] = await sql.execute('SELECT * FROM messenger.users');
    console.log(rows);
    exit();
})();