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

console.log('Setup has started...');

let error, result;

sql.query(
    `DROP SCHEMA messenger;
    CREATE SCHEMA messenger;
    
    CREATE TABLE messenger.users (
        id int NOT NULL AUTO_INCREMENT,
        username varchar(32) NOT NULL,
        password varchar(32) NOT NULL,
        display_name varchar(64) NOT NULL,
        cookie_hash varchar(64) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE INDEX id_UNIQUE (id ASC) VISIBLE
    );
    
    CREATE TABLE messenger.messages (
      id INT NOT NULL AUTO_INCREMENT,
      sender_id INT NOT NULL,
      recipient_id INT NOT NULL,
      message_text VARCHAR(512) NULL,
      datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      readmark TINYINT NULL DEFAULT 0,
      PRIMARY KEY (id),
      UNIQUE INDEX id_UNIQUE (id ASC) VISIBLE
    )`,
    (error, result) => {
        if (result) {
            console.log('Setup complete!');
        } else {
            console.log(error);
        }
        exit();
    }
);