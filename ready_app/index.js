import express from 'express';
import path from 'path';
import mysql from 'mysql2';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import fs from 'fs';
import jimp from 'jimp';

import auth from './modules/auth.js';
import hashgen from './modules/hashgen.js';
import format from './modules/format.js';
import msg from './modules/msg.js';

const __dirname = path.resolve(path.dirname(''));
const PORT = 8000;
const app = express();

app.use(express.json({limit: '5mb'}));
app.use(express.static(__dirname + '/public'));
app.use(cookieParser());
app.use(cors());

app.use(function (err, req, res, next) {
    if (err && err.type == 'entity.too.large') {
        res.status(400).send({ status: 'ERROR', errors: [`The file exceeds the limit! (${err.limit/1024/1024}Mb)`] });
    }
    else {
        next(err);
    }
});

const msgQueue = new msg.Queue(); // Очередь из отправляемых сообщений

// MySQL

const SQLDATA = JSON.parse(
    fs.readFileSync('cfg/sqlcfg.json')
);

const sql = mysql.createConnection(
    {
        ...SQLDATA,
        database: 'messenger',
        multipleStatements: true
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
    let hash = format.secure(req.cookies.userhash);
    if (!hash) {
        res.clearCookie('userhash');
        res.status(200).json({ status: 'USER_NOT_FOUND' });
        return res.end();
    }
    try {
        sql.query(
            `SELECT id FROM users WHERE cookie_hash = "${hash}" LIMIT 1`,
            (err, result) => {
                if (!result || !result[0].id) {
                    res.clearCookie('userhash');
                    res.status(200).json({ status: 'USER_NOT_FOUND'});
                    return res.end();
                }
                let userID = result[0].id;
                sql.query(
                    `SELECT
                        IF(messages.sender_id = ${userID},
                            messages.recipient_id,
                            messages.sender_id
                        ) AS chatID,
                        (SELECT display_name FROM users WHERE id = chatID) AS chatName,
                        messages.id AS messageID,
                        users.id AS senderID,
                        users.display_name AS sender,
                        messages.message_text AS text,
                        UNIX_TIMESTAMP(messages.datetime) AS datetime,
                        messages.readmark
                    FROM messages
                    JOIN users ON users.id = messages.sender_id
                    WHERE recipient_id = ${userID} OR sender_id = ${userID}
                    ORDER BY messageID`,
                    (err, result) => {
                        if (!result) {
                            res.status(200).json([]);
                            return res.end();
                        }

                        try { delete msgQueue.list[userID]; } catch {}

                        let final = [];
                        let indexes = {}; // Словарь с айди чатов по индексам, формат "index: id", чтобы не было много лишних итераций цикла

                        result.forEach(message => {
                            let chatID = message.chatID,
                                raiseUnreadCount = !message.readmark && message.senderID === message.chatID;
                            
                            let messageCut = {
                                id: message.messageID,
                                senderID: message.senderID,
                                sender: message.sender,
                                text: message.text,
                                datetime: message.datetime
                            };

                            if (indexes[chatID]) {
                                let index = indexes[chatID];
                                if (raiseUnreadCount)
                                    final[index].unreadCount++;
                                final[index].messages.push(messageCut);
                                return;
                            }

                            for (let index in final) {
                                if (final[index].id != chatID)
                                    continue;
                                if (raiseUnreadCount)
                                    final[index].unreadCount++;
                                final[index].messages.push(messageCut);
                                indexes[chatID] = index;
                                return;
                            }

                            let ppURL = `media/userpics/pp_${chatID}.jpg`;
                            if (!fs.existsSync('public/' + ppURL)) {
                                ppURL = null;
                            }

                            final.push({
                                id: chatID,
                                name: message.chatName,
                                messages: [messageCut],
                                unreadCount: raiseUnreadCount ? 1 : 0,
                                profilePicture: ppURL
                            });
                        });

                        let myPP = `media/userpics/pp_${userID}.jpg`;
                        if (!fs.existsSync('public/' + myPP)) {
                            myPP = null;
                        }
                        
                        res.status(200).json({chats: final, myID: userID, myProfilePicture: myPP});
                        res.end();
                    }
                );
            }
        );
    } catch (err) {
        res.status(200).json({ status: 'USER_NOT_FOUND' });
        res.end();
    }
});

// Ожидание сообщений

app.post('/seekMessages', (req, res) => {
    sql.query(
        `SELECT id FROM users WHERE cookie_hash = '${req.cookies.userhash}' LIMIT 1`,
        (err, result) => {
            if (!result[0]) {
                res.clearCookie('userhash');
                res.status(200).json({status: 'LOGOUT'});
                res.end();
                return;
            }
            let userID = Number(result[0].id);
            let timeout;
            let interval = setInterval(() => {
                let id = userID;
                if (msgQueue.list[id] && msgQueue.list[id].messages && msgQueue.list[id].messages.length) {
                    clearTimeout(timeout);
                    clearInterval(interval);
                    res.status(200).json({status: 'GOT_MESSAGES', messages: msgQueue.list[id].messages.splice(0)});
                    res.end();
                }
            }, 250);
            timeout = setTimeout(() => {
                clearInterval(interval);
                res.status(200).json({status: 'NO_NEW_MESSAGES'});
                res.end();
            }, 30000);
            let hash = req.cookies.userhash;
        }
    )
});

// Юзер открывает чат (пометить сообщения как прочитанные)

app.post('/readchat', (req, res) => {
    let chatID = Number(req.body.chatID),
        hash = format.secure(req.cookies.userhash);
    sql.query(
        `UPDATE messages SET readmark = 1
        WHERE sender_id = ${chatID}
        AND recipient_id = (SELECT id FROM users WHERE cookie_hash = '${hash}' LIMIT 1)`,
        (err, result) => {
            try {
                if (result.affectedRows) {
                    res.status(200).json({status: 'READ'});
                    res.end();
                } else {
                    res.status(200).json({status: 'NOT_READ'});
                    res.end();
                }
            } catch {
                res.status(200).json({status: 'NOT_READ', error: err});
                res.end();
            }
        }
    )
})

// Регистрация юзера

app.post('/register', async (req, res) => {
    const [username, password, name] = format.secureMultiple(req.body.username, req.body.password, req.body.name);
    const profilePicture = req.body.profilePicture;
    if (username && password && name) {

        let ppFinal; // Сюда отправляется аватарка, если загружена и валидна
        if (profilePicture) {
            try {
                let img = await jimp.read(
                    Buffer.from(profilePicture, 'base64')
                );
                let [width, height] = [img.bitmap.width, img.bitmap.height];
                if (!width || !height) {
                    res.status(200).json({status: 'ERROR', errors: ['Invalid image!', !width, !height, error]});
                    return res.end();
                }
                
                let cropParams = width > height
                    ? [(width-height)/2, 0, height*0.99, height*0.99]
                    : [0, (height-width)/2, width*0.99, width*0.99];

                ppFinal = img.crop(...cropParams)
            } catch (e) {
                console.log(e);
                res.status(200).json({status: 'ERROR', errors: ['Invalid file! Please load an image!']});
                return res.end();
            }
        }

        auth.register(
            username,
            password,
            name,
            // Коллбэк для успешной регистрации
            (result, data) => {
                res.cookie('userhash', data.hash);
                res.status(200).json(result);
                res.end();
                if (ppFinal) {
                    ppFinal.write(`public/media/userpics/pp_${data.id}.jpg`);
                }
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
    let [username, password] = format.secureMultiple(req.body.username, req.body.password);
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
    let hash = format.secure(req.cookies.userhash);
    let [message, recipient] = [
        format.secure(req.body.message),
        Number(req.body.recipient)
    ];
    if (!hash || !message || !recipient) {
        res.status(200).json({status: 'NOT_SENT', errors: ['Some data is missing!']});
        res.end();
        return;
    }
    sql.query(
        `SELECT id AS senderID, IF((SELECT id FROM users WHERE id = ${recipient} LIMIT 1) > 0, 1, 0) AS recipientExists
        FROM users WHERE cookie_hash = '${hash}' LIMIT 1`,
        (err, result) => {
            if (err || !result.length) {
                res.status(200).json({status: 'NOT_SENT', errors: ['User is not identified!']});
                res.end();
                return;
            }
            if (!result[0].recipientExists) {
                res.status(200).json({status: 'NOT_SENT', errors: ['Recipient does not exist!']});
                res.end();
                return;
            }
            let senderID = result[0].senderID;
            sql.query(
                `INSERT INTO messages (sender_id, recipient_id, message_text)
                VALUES (${senderID}, ${recipient}, '${message}');
                SELECT messages.id,
                users.display_name AS sender,
                messages.message_text AS text,
                UNIX_TIMESTAMP(messages.datetime) AS datetime
                FROM messages JOIN users ON messages.sender_id = users.id
                WHERE sender_id = ${senderID} AND recipient_id = ${recipient}
                ORDER BY id DESC LIMIT 1`,
                (err, result) => {
                    if (result && result[0].affectedRows) {
                        res.status(200).json({status: 'SENT', senderID: senderID, ...result[1][0]});
                        if (senderID != recipient) {
                            msgQueue.add({senderID: senderID, recipientID: recipient, ...result[1][0]});
                        }
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
                res.status(200).json({status: 'LOGGED_IN', id: result.id});
                res.end();
            } else {
                res.clearCookie('userhash');
                res.status(200).json({status: 'BAD_TOKEN'});
                res.end();
            }
        }
    )
});

// Получение всех чатов (включая чаты без сообщений)

app.post('/getallchats', (req, res) => {
    let hash = req.cookies.userhash;
    if (!hash) {
        res.clearCookie('userhash');
        res.status(200).json({ status: 'USER_NOT_FOUND' });
        res.end();
        return;
    }
    try {
        sql.query(
            `SELECT id, display_name AS name
            FROM users WHERE cookie_hash != "${hash}"`,
            (err, result) => {
                if (err) {
                    res.status(200).json({status: 'ERROR'});
                    return res.end();
                }
                const chats = result;
                if (chats.length) {
                    for (let i in chats) {
                        let ppURL = `media/userpics/pp_${chats[i].id}.jpg`;
                        if (fs.existsSync('public/' + ppURL)) {
                            chats[i].profilePicture = ppURL;
                        }
                    }
                    res.status(200).json({status: 'GOT_CHATS', chats: chats});
                    res.end();
                }
            }
        );
    } catch (err) {
        res.status(200).json([]);
        res.end();
    }
})