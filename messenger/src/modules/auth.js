async function register(app) {
    app.errors = [];
    const body = {
        username: app.registerForm.username.value,
        password: app.registerForm.password.value,
        name: app.registerForm.name.value    
    };
    if (!body.username || !body.password || !body.name) {
        app.errors.push('Some fields are empty!');
        return;
    }
    app.$emit('setLoading', true);
    const response = await fetch('api/register', {
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
    } else if (data.status === 'ERROR') {
        app.errors = data.errors;
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
    const response = await fetch('api/login', {
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
    } else if (data.status === 'ERROR') {
        app.errors = data.errors;
    }
}

async function logout(app) {
    const response = await fetch('api/logout', {
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
    const response = await fetch('api/cookieauth', {
        method: 'POST'
    });
    const data = await response.json();
    if (data.status == 'LOGGED_IN') {
        setScreen('chats');
    } else {
        setScreen('welcome');
        localStorage.clear();
    }
}

export default {
    register, login, logout, cookieAuth
}