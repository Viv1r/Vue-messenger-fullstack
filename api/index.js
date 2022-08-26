import express from 'express';
import path from 'path';
import mysql from 'mysql2';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import fs from 'fs';

import auth from './modules/auth.js';
import hashgen from './modules/hashgen.js';

const __dirname = path.resolve(path.dirname(''));
const PORT = 8000;
const app = express();

const gotMessages = []; // Сюда попадает айди юзера, если ему прислали сообщение, и удаляется, как только сообщение доставлено

app.use(express.json());
app.use(express.static(__dirname));
app.use(cookieParser());
app.use(cors());


// MySQL

const SQLDATA = JSON.parse(
    fs.readFileSync('cfg/sqlcfg.json')
);

const sql = mysql.createConnection(
    {
        multipleStatements: true,
        ...SQLDATA
    }
);

sql.connect();

// Функции для прогрузки чатов

// App

app.listen(PORT, () => {
    console.log(`The server has started successfully!\nPort: ${PORT}`);
});

// Получение списка чатов

app.post('/getchats', (req, res) => {
    let hash = req.cookies.userhash;
    if (!hash) {
        res.clearCookie('userhash');
        res.status(200).json({ status: 'USER_NOT_FOUND' });
        res.end();
        return;
    }
    console.log('user connected with token: ' + hash);
    try {
        sql.query(
            `SET @UserID = (SELECT id FROM users WHERE cookie_hash = "${hash}" LIMIT 1);
            SELECT
                IF(temp.sender_id = @UserID, temp.recipient_id, temp.sender_id) AS chatID,
                (SELECT display_name FROM users WHERE id = chatID) AS chatName,
                users.id AS senderID,
                users.display_name AS sender,
                temp.message_text AS text,
                temp.datetime,
                temp.readmark
            FROM (
                SELECT sender_id, recipient_id, message_text, datetime, readmark
                FROM messages
                WHERE recipient_id = @UserID OR sender_id = @UserID ORDER BY datetime
            ) AS temp
            JOIN users ON users.id = temp.sender_id`,
            (err, result) => {
                let final = {};
                result[1].forEach(elem => {
                    let chatID = elem.chatID;
                    final[chatID] = final[chatID] || {name: elem.chatName, messages: [], unreadCount: 0};
                    if (!elem.readmark && elem.senderID === elem.chatID)
                        final[chatID].unreadCount++;
                    final[chatID].messages.push({
                        senderID: elem.senderID,
                        sender: elem.sender,
                        text: elem.text,
                        datetime: elem.datetime
                    });
                });
                res.status(200).json(final);
                res.end();
            }
        );
    } catch (err) {
        res.status(200).json([]);
        res.end();
        console.log('error: ' + err);
    }
});

// Ожидание сообщений

app.post('/seekMessages', (req, res) => {
    sql.query(
        `SELECT id FROM users WHERE cookie_hash = '${req.cookies.userhash}' LIMIT 1`,
        (err, result) => {
            let userID = result[0].id;
            let interval = setInterval(() => {
                if (gotMessages.includes(userID)) {
                    gotMessages.splice(
                        gotMessages.indexOf(userID), 1
                    );
                    clearInterval(interval);
                    sql.query(
                        `SELECT id, `
                    )
                }
            }, 200);
            setTimeout(() => {
                clearInterval(interval);
                res.status(200).json({status: 'got nothing...'});
                res.end();
            }, 10000);
            let hash = req.cookies.userhash;
        }
    )
});

// Юзер открывает чат (пометить сообщения как прочитанные)

app.post('/readchat', (req, res) => {
    let chatID = req.body.chatID,
        hash = req.cookies.userhash;
    sql.query(
        `UPDATE messages SET readmark = 1
        WHERE sender_id = ${chatID} AND recipient_id = (SELECT id FROM users WHERE cookie_hash = '${hash}' LIMIT 1)`,
        (err, result) => {
            if (result.affectedRows) {
                res.status(200).json({status: 'READ'});
                res.end();
            } else {
                res.status(200).json({status: 'NOT_READ'});
                res.end();
            }
        }
    )
})

// Регистрация юзера

app.post('/register', (req, res) => {
    let [username, password, name] = [req.body.username, req.body.password, req.body.name];
    if (username && password && name) {
        auth.register(
            username,
            password,
            name,
            // Коллбэк для успешной регистрации
            (result, hash) => {
                res.cookie('userhash', hash);
                res.status(200).json(result);
                res.end();
            },
            // Коллбэк для неудачной регистрации
            (error) => {
                res.status(200).json(error);
                res.end();
            }
        );
    }
    else {
        res.status(200).json({status: 'ERROR', errors: ['Check your data!']});
        res.end();
    }
});

// Вход в аккаунт

app.post('/login', (req, res) => {
    let [username, password] = [req.body.username, req.body.password];
    if (!username || !password) {
        res.status(200).json({ status: 'ERROR', errors: ['Some fields are empty!'] });
        res.end();
        return;
    }
    auth.login(
        username,
        password,
        // Коллбэк для успешного входа
        (result, hash) => {
            res.cookie('userhash', hash);
            res.status(200).json(result);
            res.end();
        },
        // Коллбэк для неудачного входа
        (error) => {
            res.status(200).json(error);
            res.end();
        }
    );
});

// Логаут

app.post('/logout', (req, res) => {
    let hash = req.cookies.userhash;
    res.clearCookie('userhash');
    res.status(200).json({status: 'LOGGED_OUT'});
    res.end();
    if (!hash)
        return;
    let newHash = hashgen.generate(32);
    sql.query(
        `UPDATE messenger.users SET cookie_hash = '${newHash}' WHERE cookie_hash = '${hash}'`
    );
});

// Отправка сообщений

app.post('/sendmessage', (req, res) => {
    let hash = req.cookies.userhash;
    let [message, recipient] = [req.body.message, Number(req.body.recipient)];
    if (!hash || !message || !recipient) {
        res.status(200).json({status: 'NOT_SENT', errors: ['Some data is missing!']});
        res.end();
        return;
    }
    sql.query(
        `SELECT id AS senderID, IF((SELECT id FROM users WHERE id = ${recipient} LIMIT 1) > 0, 1, 0) AS recipientExists
        FROM users WHERE cookie_hash = '${hash}' LIMIT 1`,
        (err, result) => {
            if (!result.length) {
                res.status(200).json({status: 'NOT_SENT', errors: ['User is not identified']});
                res.end();
                return;
            }
            if (!result[0].recipientExists) {
                res.status(200).json({status: 'NOT_SENT', errors: ['Recipient not found']});
                res.end();
                return;
            }
            let senderID = result[0].senderID;
            sql.query(
                `INSERT INTO messages (sender_id, recipient_id, message_text)
                VALUES (${senderID}, ${recipient}, '${message}');
                SELECT users.display_name AS name, messages.message_text AS text, messages.datetime
                FROM messages JOIN users ON messages.sender_id = users.id
                WHERE sender_id = ${senderID} AND recipient_id = ${recipient}
                ORDER BY datetime DESC LIMIT 1`,
                (err, result) => {
                    console.log(result);
                    if (result[0].affectedRows) {
                        if (!gotMessages.includes(recipient))
                            gotMessages.push(recipient);
                        res.status(200).json({status: 'SENT', senderID: senderID, ...result[1][0]});
                    }
                    else {
                        res.status(200).json({status: 'NOT_SENT', errors: ['Server error']});
                    }
                    res.end();
                }
            );
        }
    );
});

// Вход по куки без получения сообщений

app.post('/cookieauth', (req, res) => {
    let hash = req.cookies.userhash;
    if (!hash) {
        res.status(200).json({status: 'NO_TOKEN'});
        res.end();
        return;
    }
    sql.query(
        `SELECT id FROM users WHERE cookie_hash = '${hash}' LIMIT 1`,
        (err, result) => {
            if (result.length) {
                res.status(200).json({status: 'LOGGED_IN'})
                res.end();
            } else {
                res.clearCookie('userhash');
                res.status(200).json({status: 'BAD_TOKEN'});
                res.end();
            }
        }
    )
});