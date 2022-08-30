function loadRegisterForm() {
    return {
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
}

function loadLoginForm() {
    return {
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
}

export default {
    loadReg: loadRegisterForm, loadLogin: loadLoginForm
}