<template>

<div class="loading_overlay" v-if="loading">
    <img class="loading_indicator" src="/src/assets/loading.gif" alt="loading" rel="preload">
</div>

<div :class="'app_wrapper' + (lightTheme ? ' light' : '')">
	<div v-if="screen == 'chats'" class="window">
		<ChatsDisplay
			:chats="chats"
            :allChats="allChats"
			:currentChat="currentChat"
            :chatIndex="chatIndex"
			:miniMode="miniMode"
			:lightTheme="lightTheme"
            :setChats="data => {
                chats = data;
                chatsLoaded = true;
                this.sortChats();
            }"
            :addChat="obj => chats.unshift(obj)"
            :chatsLoaded="chatsLoaded"
            @sortChats="sortChats"
            @getAllChats="getAllChats"
            @seekMessagesStart="seekMessages"
            @goToChat="goToChat"
            @logout="logout"
            @getMessage="getMessage"
			@setLightTheme="param => lightTheme = param"
		/>
	</div>
	<div v-else class="basic_screen">
		<div v-if="screen == 'welcome'" class="welcome_screen"> <!-- ЭКРАН ПРИВЕТСТВИЯ -->
			<h1>Welcome!</h1>
			<button id="register" @click="screen = 'register'">Register</button>
			<button id="login" @click="screen = 'login'">Log in</button>
		</div>
		<template v-else-if="screen == 'register'">
            <RegisterForm
                @setLoading="param => loading = param"
                @setScreen="param => screen = param"
            />
        </template>
		<template v-else-if="screen == 'login'">
            <LoginForm
                @setLoading="param => loading = param"
                @setScreen="param => screen = param"
            />
        </template>
        <ChangeTheme v-if="screen"
            @changeLightTheme="lightTheme = !lightTheme"
            :lightTheme="lightTheme"
        />
	</div>
</div>
</template>

<script>
import RegisterForm from './components/RegisterForm.vue';
import LoginForm from './components/LoginForm.vue';
import ChatsDisplay from './components/ChatsDisplay.vue';
import ChangeTheme from './components/ChangeTheme.vue';
import auth from './modules/auth.js';
export default {
	components: {
        ChatsDisplay,
        ChangeTheme,
        RegisterForm,
        LoginForm
    },
    data() {
        return {
            currentChat: null,
            screen: null,
            lightTheme: false,
            loading: false,
            miniMode: false,
            chats: [],
            allChats: [],
            chatsLoaded: false,
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
        goToChat(id) {
            if (id != null && !id)
                return;
            this.currentChat = id;
            if (id) {
                this.readChat(id);
            }
        },
        async readChat(id) {
            const response = await fetch('api/readchat', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chatID: id
                })
            });
            const data = await response.json();
            if (data.status == 'READ') {
                this.chats[this.chatIndex(id)].unreadCount = 0;
            }
        },
        logout() {
            auth.logout(this);
            localStorage.clear();
        },
		updateChats(arg) {
			console.log('Update chats');
		},
        sortChats() {
            if (this.chats.length >= 2) {
                console.log('sorting chats');
                this.chats == this.chats.sort((a, b) => {
                    return a.messages.length && b.messages.length
                        ? b.messages[b.messages.length-1].id - a.messages[a.messages.length-1].id
                        : a.messages.length || b.messages.length * -1
                });
            }
        },
        async seekMessages() {
            const response = await fetch('api/seekmessages', {method: 'POST'});
            const data = await response.json();
            if (data.status == 'LOGOUT') {
                localStorage.clear();
                app.currentChat = null;
                app.chats = {};
                return;
            }
            console.log(data);
            if (data.status == 'GOT_MESSAGES' && data.messages) {
                data.messages.forEach(elem => {
                    let [senderID, sender, text, datetime] = [elem.senderID, elem.sender, elem.text, elem.datetime];
                    if (this.currentChat == senderID) {
                        this.readChat(senderID);
                    }
                    if (senderID && sender) {
                        if (!this.chats[this.chatIndex(senderID)]) {
                            this.chats.unshift({
                                id: senderID,
                                name: sender,
                                messages: [],
                                unreadCount: 0
                            });
                        }
                        let thisChat = this.chats[this.chatIndex(senderID)];
                        thisChat.messages.push({
                            senderID: senderID,
                            sender: sender,
                            text: text || '',
                            datetime: datetime || 'Out of time'
                        });
                        thisChat.unreadCount++;
                    }
                });
                this.sortChats();
            }
            this.seekMessages();
        },
        async getAllChats() {
            const response = await fetch('api/getallchats', {method: 'POST'});
            const data = await response.json();
            if (data.status = 'GOT_CHATS') {
                this.allChats = JSON.parse(JSON.stringify(data.chats));
            }
        },
        getMessage(id, chatID, senderID, name, text, datetime) {
            this.chats[this.chatIndex(chatID)].messages.push(
                {
                    id: id,
                    senderID: senderID,
                    sender: name,
                    text: text,
                    datetime: datetime
                }
            )
        },
        chatIndex(id) {
            for (let index in this.chats) {
                if (this.chats[index] && this.chats[index].id == id) {
                    return index;
                }
            }
            return null;
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
