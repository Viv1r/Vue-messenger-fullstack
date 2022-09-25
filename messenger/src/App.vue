<template>

<Transition name="fade">
    <div class="loading_overlay" v-if="loading">
        <img
            class="loading_indicator"
            src="/src/assets/loading.gif"
            alt="loading"
            rel="preload"
        >
    </div>
</Transition>

<div :class="'app_wrapper' + ($store.state.lightTheme ? ' light' : '')">
    <Transition name="fade">
        <div v-if="screen == 'chats'"
            :class="'window' + (miniMode ? ' maxed' : '')"
            key="window"
        >
            <ChatList
                :chats="chats"
                :allChats="allChats"
                :currentChatID="currentChatID"
                :miniMode="miniMode"
                :addChat="addChat"
                :chatIndex="chatIndex"
                @goToChat="goToChat"
                @logout="logout"
                @getAllChats="getAllChats"
            />
            <ChatDisplay
                :currentChat="chats[chatIndex(currentChatID)]"
                :currentChatID="currentChatID"
                :myID="myID"
                :myProfilePicture="myProfilePicture"
                :miniMode="miniMode"
                :chatsLoaded="chatsLoaded"
                @goToChat="goToChat"
                @getMessage="getMessage"
                @mounted="loadChats"
            />
            <ChangeTheme v-if="!miniMode"/>
        </div>
        <div v-else class="basic_screen" key="basic_screen">
            <Transition name="fade_move">
                <div v-if="screen == 'welcome'" class="welcome_screen" key="welcome_screen"> <!-- ЭКРАН ПРИВЕТСТВИЯ -->
                    <h1>Welcome!</h1>
                    <button id="register" @click="screen = 'register'">Register</button>
                    <button id="login" @click="screen = 'login'">Log in</button>
                </div>
                <template v-else-if="screen == 'register'" key="register_screen">
                    <RegisterForm
                        @setLoading="param => loading = param"
                        @setScreen="param => screen = param"
                    />
                </template>
                <template v-else-if="screen == 'login'" key="login_screen">
                    <LoginForm
                        @setLoading="param => loading = param"
                        @setScreen="param => screen = param"
                    />
                </template>
            </Transition>
            <ChangeTheme v-if="screen"/>
        </div>
    </Transition>
</div>
</template>

<script>
import RegisterForm from './components/RegisterForm.vue';
import LoginForm from './components/LoginForm.vue';
import ChatDisplay from './components/ChatDisplay.vue';
import ChatList from './components/ChatList.vue';
import ChangeTheme from './components/ChangeTheme.vue';

import a_GotMessage from './assets/got_message.mp3';

import auth from './modules/auth.js';
import loadchats from './modules/load_chats.js';
import ChatList1 from './components/ChatList.vue';

export default {
	components: {
        ChatList,
        ChatDisplay,
        ChangeTheme,
        RegisterForm,
        LoginForm,
        ChatList1
    },
    data() {
        return {
            screen: null,
            loading: false,
            miniMode: false,
            chats: [],
            allChats: [],
            currentChatID: null,
            chatsLoaded: false,
            myID: null,
            myProfilePicture: null
        };
    },
    created() {
        this.Audio_GotMessage = new Audio(a_GotMessage);

        window.addEventListener('keydown', (e) => {
            if (this.currentChatID >= 0 && e.key == 'Escape') {
                this.currentChatID = null;
            }
        });

        const checkWindowSize = setInterval(() => {
            this.miniMode = window.innerWidth < 1000;
        }, 250);

        this.$store.commit(
            'setLightTheme',
            localStorage.getItem('light-theme') === 'true'    
        );

        auth.cookieAuth(screen => this.screen = screen,
            id => this.myID = id);
    },
    methods: {
        goToChat(id) {
            if (id !== null && id !== 0 && !id) return;
            this.currentChatID = id;
            if (id) {
                this.readChat(id);
            }
        },
        async readChat(id) {
            const URL = 'api/readchat';
            const response = await fetch(URL, {
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
            this.chatsLoaded = false;
            this.currentChatID = null;
        },
        async loadChats() {
            await loadchats.load(data => {
                this.chats = data.chats;
                this.myID = data.myID;
                this.myProfilePicture = data.myProfilePicture;
            });
            this.sortChats();
            this.seekMessages();
        },
        addChat(chat) {
            this.chats.unshift(chat);
        },
        sortChats() {
            if (this.chats.length >= 2) {
                this.chats == this.chats.sort((a, b) => {
                    return a.messages.length && b.messages.length
                        ? b.messages[b.messages.length-1].id - a.messages[a.messages.length-1].id
                        : a.messages.length || b.messages.length * -1
                });
            }
        },
        async seekMessages() {
            const URL = 'api/seekmessages';
            const response = await fetch(URL, {method: 'POST'});
            const data = await response.json();
            if (data.status == 'LOGOUT') {
                localStorage.clear();
                this.currentChatID = null;
                this.chats = {};
                return;
            }
            if (data.status == 'GOT_MESSAGES' && data.messages) {
                data.messages.forEach(elem => {
                    const [id, senderID, recipientID, sender, text, datetime, profilePicture]
                    = [elem.id, elem.senderID, elem.recipientID, elem.sender, elem.text, elem.datetime, elem.profilePicture];
                    let chatID = senderID;
                    if (Number(recipientID) <= 0) {
                        chatID = recipientID;
                    }
                    if (this.currentChatID == chatID) {
                        this.readChat(chatID);
                    }
                    if (senderID >= 0 && senderID != this.myID && sender) {
                        this.Audio_GotMessage.play();
                        if (!this.chats[this.chatIndex(chatID)]) {
                            this.chats.unshift({
                                id: senderID,
                                name: sender,
                                messages: [],
                                unreadCount: 0,
                                profilePicture: profilePicture || null
                            });
                        }
                        let thisChat = this.chats[this.chatIndex(chatID)];
                        thisChat.messages.push({
                            id: id,
                            senderID: senderID,
                            sender: sender,
                            text: text || '',
                            datetime: datetime || 'Out of time'
                        });
                        thisChat.unreadCount++;
                    }
                });
            }
            this.sortChats();
            if (this.screen == 'chats') {
                this.seekMessages();
            }
        },
        async getAllChats() {
            const URL = 'api/getallchats';
            const response = await fetch(URL, {method: 'POST'});
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
            );
            this.sortChats();
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

.fade-enter-active,
.fade-leave-active {
    transition: all .25s ease-out;
}

.fade-enter,
.fade-leave-to {
    transition: all .25s ease-out;
    opacity: 0;
}

.fade_move-enter-active,
.fade_move-leave-active,
.fade_move-enter,
.fade_move-leave-to {
    transition: all .15s ease-out;
}

.fade_move-enter-active {
    transform: translateX(-100px);
    opacity: 0;
}

.fade_move-leave-to {
    transform: translateX(100px);
    opacity: 0;
}

</style>
