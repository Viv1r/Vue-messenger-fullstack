<template>

<div v-if="miniMode ? (currentChatID === null) : (true)" :class="'chatlist_menu' + (miniMode ? ' maxed' : '')">
    <div class="chatlist_header">
        <h1>{{ allChatsMenu ? 'All chats' : 'Your chats' }}</h1>
        <ChangeTheme v-if="miniMode"/>
    </div>
    <div v-if="allChatsMenu" class="chatlist_allchats">
        <div class="chatlist_wrapper">
            <div v-for="chat in allChats" class="chat minimized" @click="tryGoToChat(chat)">
                <div
                    class="profile_picture"
                    :style="chat.profilePicture ? `background-image: url(api/${chat.profilePicture})` : ''"
                ></div>
                {{ chat.name }}
            </div>
        </div>
    </div>
    <div v-else-if="JSON.stringify(chats) != '{}'" class="chatlist">
        <div class="chatlist_wrapper">
            <div
                v-for="chat in chats"
                :class="'chat' + (Number(currentChatID) === Number(chat.id) ? ' selected' : '')"
                @click="$emit('goToChat', chat.id)"
            >
                <div class="chat_info">
                    <div
                        class="profile_picture"
                        :style="chat.profilePicture ? `background-image: url(api/${chat.profilePicture})` : ''"
                    />
                    <div class="content">
                        <h1>{{ chat.name }}</h1>
                        <p>{{ getLastMessage(chat) }}</p>
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
        <div class="button_new_chat" @click="newChatClick()">
            <img src="/src/assets/new_chat.svg" alt="new_chat">
            New chat
        </div>
        <div class="button_logout" @click="$emit('logout')">
            <img src="/src/assets/logout.svg" alt="logout">
            Logout
        </div>
    </div>
</div>

</template>

<script>
import ChangeTheme from './ChangeTheme.vue';

export default {
	components: {
        ChangeTheme
    },
    data() {
        return {
            allChatsMenu: false
        }
    },
    props: {
        chats: { type: Array, default: [] },
        allChats: { type: Array, default: [] },
        currentChatID: { default: null },
        miniMode: { type: Boolean, default: false },
        addChat: Function,
        chatIndex: Function
    },
    emits: ['goToChat', 'logout', 'getAllChats'],
    methods: {
        newChatClick() {
            this.allChatsMenu = !this.allChatsMenu;
            if (this.allChatsMenu) {
                this.$emit('getAllChats');
            }
        },
        tryGoToChat(chat) {
            this.allChatsMenu = false;
            if (!this.chats[this.chatIndex(chat.id)]) {
                this.addChat({ id: chat.id, name: chat.name, messages: [], unreadCount: 0, profilePicture: chat.profilePicture });
            }
            this.$emit('goToChat', chat.id);
        },
        getLastMessage(chat) {
            if (!chat.messages || !chat.messages.length)
                return 'No messages';
            try {
                return chat.messages[chat.messages.length - 1].sender
                    + ': '
                    + chat.messages[chat.messages.length - 1].text;
            }
            catch {
                return '...';
            }
        },
    }
}
</script>