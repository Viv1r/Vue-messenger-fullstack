<template>

<div class="loading_overlay" v-if="loading">
    <img class="loading_indicator" src="/src/assets/loading.gif" alt="loading" rel="preload">
</div>

<div :class="'app_wrapper' + (lightTheme ? ' light' : '')">
	<div v-if="screen == 'chats'" class="window">
		<chats-display
			:chats="chats"
			:currentChat="currentChat"
			:miniMode="miniMode"
			:lightTheme="lightTheme"
            :goToChat="goToChat"
            :setChats="(data) => chats = data"
            :setCurrentChat="(id) => currentChat = id"
            :logout="logout"
            @addMessage="(chatID, senderID, name, text, datetime) =>
                this.chats[chatID].messages.push(
                    {
                        senderID: senderID,
                        sender: name,
                        text: text,
                        datetime: datetime
                    }
                )"
			@setLightTheme="(param) => lightTheme = param"
		/>
	</div>
	<div v-else class="basic_screen">
		<div v-if="screen == 'welcome'" class="welcome_screen"> <!-- ЭКРАН ПРИВЕТСТВИЯ -->
			<h1>Welcome!</h1>
			<button id="register" @click="regScreen();">Register</button>
			<button id="login" @click="loginScreen()">Log in</button>
		</div>
		<div v-else-if="screen == 'register'" class="register_form"> <!-- РЕГИСТРАЦИЯ -->
			<h1>Register</h1>
			<div class="field_wrapper" v-for="(inp, index) in registerForm">
				<template v-if="inp.type != 'image'">
                    {{ inp.title }}
                    <input
                        :class="'reg_inp_'+inp.type"
                        :type="inp.type"
                        :name="index"
                        v-model="inp.value"
                        @keydown.enter="register()"
                    >
                </template>
                <template v-else-if="inp.type == 'image'">
                    {{ inp.title }}
                    <input type="file" class="reg_inp_file" id="pp_input" accept="image/png, image/jpeg" hidden
                        @change="inp.value = $event.target.files[0]"
                    >
                    <label for="pp_input">
                        <img src="/src/assets/upload_picture.svg" alt="upload">
                        Upload a picture
                    </label>
                </template>
			</div>
            <div v-for="err in registerErrors" class="auth_error">{{ err }}</div>
			<div class="register_button_wrapper">
				<button id="register" @click="register()">Register</button>
			</div>
			<button class="button_return" @click="screen = 'welcome'">Back</button>
		</div>
		<div v-else-if="screen == 'login'" class="login_form"> <!-- ВХОД -->
			<h1>Log in</h1>
			<div class="field_wrapper" v-for="(inp, index) in loginForm">
				<template v-if="(typeof(inp) == 'object')">
					{{ inp.title }}
					<input
                        :class="'log_inp_'+inp.type"
                        :type="inp.type"
                        :name="index"
                        v-model="inp.value"
                        @keydown.enter="login()"
                    >
				</template>
			</div>
            <div v-for="err in loginErrors" class="auth_error">{{ err }}</div>
            <div class="login_button_wrapper">
                <button id="login" @click="login()">Log in</button>
			</div>
			<button class="button_return" @click="screen = 'welcome'">Back</button>
		</div>
	</div>
</div>
</template>

<script>

import ChatsDisplay from './components/ChatsDisplay.vue';
import auth from './modules/auth.js';
import authForms from './modules/auth_forms.js'
export default {
	components: {
		ChatsDisplay
	},
    data() {
        return {
            currentChat: null,
            screen: null,
            lightTheme: false,
            loading: false,
            miniMode: false,
            chats: {},
            registerForm: {},
            registerErrors: [],
            loginForm: {},
            loginErrors: []
        };
    },
    mounted() {
        window.addEventListener("keydown", (e) => {
            if (this.currentChat && e.key == "Escape") {
                this.currentChat = null;
            }
        });
        const checkWindowSize = setInterval(() => {
            this.miniMode = window.innerWidth < 1000;
        }, 100);
        auth.cookieAuth((screen) => this.screen = screen);
    },
    methods: {
        goToChat(i) {
            this.currentChat = i;
            this.readChat(i);
        },
        readChat(id) {
            fetch('api/readchat', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chatID: id
                })
            })
            .then(data => data.json())
            .then(result => {
                if (result.status == 'READ') {
                    this.chats[id].unreadCount = 0;
                }
            });
        },
        regScreen() {
            authForms.loadReg(this);
            this.screen = 'register';
        },
        loginScreen() {
            authForms.loadLogin(this);
            this.screen = 'login';
        },
        register() {
            auth.register(this);
        },
        login() {
            auth.login(this);
        },
        logout() {
            auth.logout(this);
        },
		updateChats(arg) {
			console.log('Update chats');
		}
    }
}

</script>

<style>
@import './assets/base.css';

#app {
	margin: 0;
	padding: none;
	font-weight: normal;
	width: 100%;
	min-height: 100%;
}

.fade-enter-active, .fade-leave-active {
    transition: opacity .25s ease-out;
	opacity: 100;
}

.fade-enter, .fade-leave-to {
    transition: opacity .25s ease-out;
    opacity: 0;
}

</style>
