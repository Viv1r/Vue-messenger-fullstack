async function register(app) {
    app.registerErrors = [];
    let body = {
        username: app.registerForm.username.value,
        password: app.registerForm.password.value,
        name: app.registerForm.name.value    
    };
    if (!body.username || !body.password || !body.name) {
        app.registerErrors.push('Some fields are empty!');
        return;
    }
    app.loading = true;
    await fetch('register', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
    .then(data => data.json())
    .then(result => {
        app.loading = false;
        if (result.status === 'REGISTERED') {
            app.screen = 'chats';
        } else if (result.status === 'ERROR') {
            result.errors.forEach(err => app.registerErrors.push(err));
        }
    });
}

async function login(app) {
    app.loginErrors = [];
    let body = {
        username: app.loginForm.username.value,
        password: app.loginForm.password.value
    };
    if (!body.username || !body.password) {
        app.loginErrors.push('Some fields are empty!');
        return;
    }
    app.loading = true;
    await fetch('login', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
    .then(data => data.json())
    .then(result => {
        app.loading = false;
        if (result.status === 'LOGGED_IN') {
            app.screen = 'chats';
        } else if (result.status === 'ERROR') {
            result.errors.forEach(err => app.loginErrors.push(err));
        }
    });
}

async function logout(app) {
    await fetch('logout', {
        method: 'POST'
    })
    .then(data => data.json())
    .then(result => {
        if (result.status = 'LOGGED_OUT')
            app.loginScreen();
            app.currentChat = null;
            app.chats = {};
    });
}

async function cookieAuth(setScreen) {
    await fetch('cookieauth', {
        method: 'POST'
    })
    .then(data => data.json())
    .then(result => {
        if (result.status === 'LOGGED_IN'){
            setScreen('chats');
        } else {
            setScreen('welcome');
        }
    });
}

export default {
    register, login, logout, cookieAuth
}