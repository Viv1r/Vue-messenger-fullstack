<template>

<div v-if="miniMode ? (currentChat === null) : (true)" :class="'chatlist_menu' + (miniMode ? ' maxed' : '')">
    <div class="chatlist_header">
        <h1>{{ allChatsMenu ? 'All chats' : 'Your chats' }}</h1>
    </div>
    <div v-if="allChatsMenu" class="chatlist_allchats">
        <div v-for="chat in allChats" class="chat" @click="() => {
            goToChat(chat.id); 
            allChatsMenu = false;
            chats[chat.id] = { name: chat.name, messages: [], unreadCount: 0 };
        }">
            {{ chat.name }}
        </div>
    </div>
    <div v-else-if="JSON.stringify(chats) != '{}'" class="chatlist">
        <div class="chatlist_wrapper">
            <div v-for="(chat, index) in chats" :class="'chat' + (currentChat === index ? ' selected' : '')" @click="goToChat(index)">
                <div class="chat_info">
                    <div class="profile_picture"></div>
                    <div class="content">
                        <h1>{{ chat.name }}</h1>
                        <p>{{ getLastMessage(chat, miniMode ? 60 : 30) }}</p>
                    </div>
                    <div v-if="chat.unreadCount" class="unread_counter">
                        {{ chat.unreadCount }}
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div v-else-if="chatsLoaded" class="no_chats">
        <p>No chats!</p>
    </div>
    <div class="chatlist_footer">
        <div class="button_new_chat" @click="getAllChats()">
            <img src="/src/assets/new_chat.svg" alt="new_chat">
            New chat
        </div>
        <div class="button_logout" @click="$emit('logout')">
            <img src="/src/assets/logout.svg" alt="logout">
            Logout
        </div>
    </div>
</div>

<div v-if="currentChat === null && !miniMode" class="no_chat">
    <img src="/src/assets/nochat.png" alt="no chat" rel="preload">
    <p>No chat selected</p>
</div>

<div v-else-if="miniMode ? (currentChat !== null) : true" :class="'current_chat' + (miniMode ? ' maxed' : '')">
    <div class="chat_header">
        <button v-if="miniMode" @click="$emit('goToChat', null)">←</button>
        <h1>{{ chats[currentChat].name }}</h1>
    </div>
    <div class="messages_window">
        <template v-if="chats[currentChat].messages.length > 0">
            <div class="messages_wrapper">
                <div class="messages_list">
                    <div class="message" v-for="(message, index) in chats[currentChat].messages">
                        <div class="message_info"
                            v-if="index == 0 || (message.senderID != chats[currentChat].messages[index-1].senderID)"
                        >
                            <h1>
                                {{ message.sender }}
                            </h1>
                            <div class="datetime">
                                {{ tsmask(message.datetime) }}
                            </div>
                        </div>
                        <p class="message_content">
                            {{ message.text }}
                        </p>
                    </div>
                </div>
            </div>
        </template>
        <template v-else>
            <div class="no_messages">
                <img src="/src/assets/nomessages.png" alt="no messages" rel="preload">
                <p>No messages!</p>
            </div>
        </template>
    </div>
    <div class="typeline">
        <input type="text" v-model="toSend" @keydown.enter="sendMessage()" @input="setDraft($event.target.value)">
        <div :class="'sendbutton' + (toSend.length ? '' : ' inactive')" @click="sendMessage()">
            <img src="../assets/send_message.png" alt="send_message" rel="preload">
        </div>
    </div>
</div>

<div class="changetheme_button" @click="$emit('setLightTheme', !lightTheme)">
    <div class="changetheme_sunmoon" :style="lightTheme ? 'background-color: rgb(255, 208, 0); box-shadow: 0px 0px 10px #ffea00' : ''">
        <div class="changetheme_circle_above" :style="lightTheme ? 'transform: translateX(64px); cursor: default; background-color: white' : ''"></div>
    </div>
</div>

</template>

<script>
import loadchats from '../modules/load_chats';
import format from '../modules/format';

export default {
    data() {
        return {
            toSend: "",
            allChatsMenu: false
        }
    },
    el: '#app',
    props: {
        chats: { type: Object, default: {} },
        allChats: { type: Array, default: [] },
        currentChat: { default: null },
        miniMode: { type: Boolean, default: false },
        lightTheme: { type: Boolean, default: false },
        chatsLoaded: { type: Boolean, default: false },
        setChats: Function,
        setCurrentChat: Function
    },
    emits: ['setLightTheme', 'addMessage', 'goToChat', 'logout', 'seekMessagesStart', 'getAllChats'],
    methods: {
        getLastMessage(chat, length) {
            try {
                let result = chat.messages[chat.messages.length - 1].sender + ": " + chat.messages[chat.messages.length - 1].text;
                return format.strcut(result, length);
            }
            catch {
                return "...";
            }
        },
        sendMessage() {
            let [recipientID, message] = [this.currentChat, this.toSend];
            if (!recipientID || !message.length)
                return;
            this.toSend = '';
            localStorage.removeItem('draft_' + recipientID);
            document.querySelector('.messages_wrapper').scrollTop = 0;
            fetch('api/sendmessage', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    recipient: recipientID,
                    message: message
                })
            })
            .then(data => data.json())
            .then(result => {
                if (result.status === 'SENT'){
                    this.$emit('addMessage',
                        recipientID,
                        result.senderID,
                        result.sender,
                        result.text,
                        result.datetime
                    );
                }
            });
        },
        tsmask(ts) {
            return ts
                ? format.mask(ts, '####.##.## ##:##')
                : 'out of time'
        },
        setDraft(text) {
            localStorage.setItem('draft_' + this.currentChat, text);
        },
        goToChat(index) {
            this.$emit('goToChat', index);
            this.toSend = localStorage.getItem('draft_' + index) || '';
        },
        getAllChats() {
            this.allChatsMenu = !this.allChatsMenu;
            if (this.allChatsMenu) {
                this.$emit('getAllChats');
            }
        }
    },
    mounted() {
        loadchats.load(this.setChats);
        this.$emit('seekMessagesStart');
    }
}

</script>

<style>

</style>