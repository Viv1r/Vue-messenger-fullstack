<template>

<div v-if="currentChatID === null && !miniMode" class="no_chat">
    <img src="/src/assets/nochat.png" alt="no chat" rel="preload">
    <p>No chat selected</p>
</div>

<div v-else-if="miniMode ? (currentChatID !== null) : true" :class="'current_chat' + (miniMode ? ' maxed' : '')">
    <div class="chat_header">
        <button v-if="miniMode" @click="$emit('goToChat', null)">←</button>
        <h1>{{ currentChat.name || 'No name' }}</h1>
        <ChangeTheme v-if="miniMode"/>
    </div>
    <div class="messages_window">
        <template v-if="currentChat.messages.length > 0">
            <div class="messages_wrapper">
                <div class="messages_list">
                    <div class="message" v-for="(message, index) in currentChat.messages" :title="formatDT(message.datetime)"> 
                        <template v-if="index == 0
                                    || (message.senderID != currentChat.messages[index-1].senderID)
                                    || (message.datetime - currentChat.messages[index-1].datetime > 300)"
                        >
                            <div v-if="message.senderID == myID"
                                class="profile_picture"
                                :style="myProfilePicture
                                    ? `background-image: url(api/${myProfilePicture})`
                                    : ''"
                            ></div>
                            <div v-else
                                class="profile_picture"
                                :style="currentChat.profilePicture
                                    ? `background-image: url(api/${currentChat.profilePicture})`
                                    : ''"
                            >
                            </div>
                            <div class="message_content">
                                <div class="message_info">
                                    <h1>{{ message.sender }}</h1>
                                    <div class="message_time">{{ formatDT(message.datetime, true) }}</div>
                                </div>
                                <div class="message_text">{{ message.text }}</div>
                            </div>
                        </template>
                        <div v-else class="message_text no_info">{{ message.text }}</div>
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
        <div :class="'attach_file'" @click="() => {}">
            <img src="../assets/attach_file.svg" alt="attach_file" rel="preload">
        </div>
        <div class="input_wrapper">
            <input
                type="text"
                v-model="toSend"
                @keydown.enter="sendMessage()"
                @input="setDraft($event.target.value)"
                :style="toSend.length > 500 ? 'color: #801818' : ''"
            >
        </div>
        <div :class="'send_message' + (toSend.length > 0 && toSend.length <= MESSAGE_MAX_LENGTH ? '' : ' inactive')" @click="sendMessage()">
            <img src="../assets/send_message.png" alt="send_message" rel="preload">
        </div>
    </div>
</div>

</template>

<script>
import ChangeTheme from './ChangeTheme.vue';
import a_SendMessage from '../assets/send_message.mp3';

export default {
	components: {
		ChangeTheme
	},
    created() {
        this.MESSAGE_MAX_LENGTH = 500;
        this.Audio_SendMessage = new Audio(a_SendMessage);
    },
    data() {
        return {
            toSend: "",
        }
    },
    props: {
        currentChat: { type: Object, default: {} },
        currentChatID: { type: Number, default: null },
        myID: { type: Number, default: null },
        myProfilePicture: { type: String, default: null },
        miniMode: { type: Boolean, default: false },
        chatsLoaded: { type: Boolean, default: false }
    },
    emits: ['getMessage', 'goToChat', 'logout', 'mounted'],
    methods: {
        async sendMessage() {
            this.Audio_SendMessage.play();
            let [recipientID, message] = [this.currentChatID, this.toSend];
            if (!recipientID || message.length < 1 || message.length > this.MESSAGE_MAX_LENGTH)
                return;
            this.toSend = '';
            localStorage.removeItem('draft_' + recipientID);
            let messagesWrapper;
            if (messagesWrapper = document.querySelector('.messages_wrapper'))
                messagesWrapper.scrollTop = 0;

            const URL = 'api/sendmessage';
            const response = await fetch(URL, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    recipient: recipientID,
                    message: message
                })
            });
            const data = await response.json();
            if (data.status === 'SENT'){
                this.$emit('getMessage',
                    data.id,
                    recipientID,
                    data.senderID,
                    data.sender,
                    data.text,
                    data.datetime
                );
            }
        },
        formatDT(timestamp, onlyTime) {
            let result = new Date(timestamp*1000).toLocaleString().replace(',', '');
            return onlyTime
                ? result.slice(11, result.length-3)
                : result.slice(0, result.length-3);
        },
        setDraft(text) {
            localStorage.setItem('draft_' + this.currentChatID, text);
        }
    },
    watch: {
        currentChatID: function(val) {
            this.toSend = localStorage.getItem('draft_' + val) || '';
            // Фокус на строке ввода
            let result;
            let interval = setInterval(() => {
                result = document.querySelector(
                    '.typeline .input_wrapper input'
                );
                if (result) {
                    result.focus();
                }
            }, 50);
            setTimeout(() => {
                clearInterval(interval);
                return;
            }, 250);
        }
    },
    mounted() {
        this.$emit('mounted');
    }
}

</script>

<style>

</style>