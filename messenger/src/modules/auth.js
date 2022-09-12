async function register(app) {
    app.errors = [];
    const body = {};
    for (let key in app.registerForm) {
        body[key] = app.registerForm[key].value || null;
    }
    if (!body.username || !body.password || !body.name) {
        app.errors.push('Some fields are empty!');
        return;
    }

    app.$emit('setLoading', true);

    const URL = 'api/register';
    const response = await fetch(URL, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    const data = await response.json();

    app.$emit('setLoading', false);

    if (data.status == 'REGISTERED') {
        app.$emit('setScreen', 'chats');
    } else if (data.status == 'ERROR') {
        app.errors = data.errors;
        console.log('data', data);
    }
}

async function login(app) {
    app.errors = [];
    const body = {
        username: app.loginForm.username.value,
        password: app.loginForm.password.value
    };
    if (!body.username || !body.password) {
        app.errors.push('Some fields are empty!');
        return;
    }

    app.$emit('setLoading', true);

    const URL = 'api/login';
    const response = await fetch(URL, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    const data = await response.json();

    app.$emit('setLoading', false);

    if (data.status == 'LOGGED_IN') {
        app.$emit('setScreen', 'chats');
    } else if (data.status == 'ERROR') {
        app.errors = data.errors;
    }
}

async function logout(app) {
    const URL = 'api/logout';
    const response = await fetch(URL, {
        method: 'POST'
    });
    const data = await response.json();
    if (data.status == 'LOGGED_OUT') {
        app.screen = 'login';
        app.currentChat = null;
        app.chats = {};
    }
}

async function cookieAuth(setScreen) {
    const URL = 'api/cookieauth';
    const response = await fetch(URL, {
        method: 'POST'
    });
    const data = await response.json();
    if (data.status == 'LOGGED_IN') {
        setScreen('chats');
    } else {
        setScreen('welcome');
        let lt = localStorage.getItem('light-theme');
        localStorage.clear();
        if (lt)
            localStorage.setItem('light-theme', lt);
    }
}

export default {
    register, login, logout, cookieAuth
}