function loadRegisterForm(app) {
    app.registerForm = {
        username: {
            title: "Username",
            type: "text",
            value: ""
        },
        password: {
            title: "Password",
            type: "password",
            value: ""
        },
        name: {
            title: "Profile name",
            type: "text",
            value: ""
        },
        profilePicture: {
            title: "Profile picture",
            type: "image",
            value: {a: 'a'}
        }
    };
    app.registerErrors = [];
}

function loadLoginForm(app) {
    app.loginForm = {
        username: {
            title: "Username",
            type: "text",
            value: ""
        },
        password: {
            title: "Password",
            type: "password",
            value: ""
        }
    };
    app.loginErrors = [];
}

export default {
    loadReg: loadRegisterForm, loadLogin: loadLoginForm
}