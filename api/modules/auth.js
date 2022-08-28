import hashgen from "./hashgen.js";
import mysql from 'mysql2';
import fs from 'fs';

const SQLDATA = JSON.parse(
    fs.readFileSync('cfg/sqlcfg.json')
);

const sql = mysql.createConnection({
    ...SQLDATA,
    database: 'messenger'
});

const reqs = {
    username: {
        title: 'username',
        min_length: 4,
        max_length: 24
    },
    password: {
        title: 'password',
        min_length: 8,
        max_length: 32
    },
    displayName: {
        title: 'name',
        min_length: 3,
        max_length: 16
    }
}

function register(username, password, displayName, success, error) {
    sql.query(
        `SELECT id FROM users WHERE username = '${username}'`,
        (err, result) => {
            [reqs.username.value, reqs.password.value, reqs.displayName.value]
            = [username, password, displayName];

            // Проверка условий для регистрации
            let troubles = [];
            
            if (result.length)
                troubles.push("This username is taken!");
            
            for (let elem of [reqs.username, reqs.password, reqs.displayName]) {
                console.log(elem);
                if (elem.value.length < elem.min_length || elem.value.length > elem.max_length) {
                    troubles.push(`The ${elem.title} doesn't match the requirements! (${elem.min_length} - ${elem.max_length} characters)`);
                }
            }
            
            if (troubles.length) {
                error({ status: 'ERROR', errors: troubles });
                return;
            }

            // Далее регаем, если проверка прошла успешно
            let userHash = hashgen.generate(32);
            sql.query(
                `INSERT INTO users (username, password, display_name, cookie_hash)
                VALUES ('${username}', '${password}', '${displayName}', '${userHash}')`,
                (err, result) => {
                    if (result.affectedRows) {
                        success({ status: 'REGISTERED' }, userHash);
                    } else {
                        error({ status: 'ERROR', errors: ['Cannot register right now'] });
                    }
                }
            );
        }
    );
}

function login(username, password, success, error) {
    sql.query(
        `SELECT password, id FROM users WHERE username = '${username}'`,
        (err, result) => {
            if (!result.length) {
                return error({ status: 'ERROR', errors: [`User with username "${username}" not found!`] });
            }
            for (let user of result) {
                if (user.password === password) {
                    let hash = hashgen.generate(32);
                    sql.query(`UPDATE messenger.users SET cookie_hash = '${hash}' WHERE id = ${user.id}`);
                    return success({ status: 'LOGGED_IN' }, hash);
                }
            }
            error({ status: 'ERROR', errors: ['Wrong password!'] });
        }
    );
}

// Не ограничил число юзеров. Мало ли случайно появилось два юзера с одним логином (админ накосячил, например),
// пусть вход осуществляется в аккаунт первого юзера с подходящим паролем :D

export default {
    register, login
}