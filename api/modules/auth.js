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

const [USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH] = [5, 24],
      [PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH] = [8, 32],
      [DISPLAYNAME_MIN_LENGTH, DISPLAYNAME_MAX_LENGTH] = [3, 16];

function register(username, password, displayName, success, error) {
    sql.query(
        `SELECT id FROM users WHERE username = '${username}'`,
        (err, result) => {

            // Проверка условий для регистрации
            let troubles = [];
            if (result.length)
                troubles.push("This username is taken!");
            if (username.length < USERNAME_MIN_LENGTH || username.length > USERNAME_MAX_LENGTH)
                troubles.push("The username doesn't match the requirements!");
            if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH)
                troubles.push("The password doesn't match the requirements!");
            if (displayName.length < DISPLAYNAME_MIN_LENGTH || displayName.length > DISPLAYNAME_MAX_LENGTH)
                troubles.push("The name doesn't match the requirements!");
            
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