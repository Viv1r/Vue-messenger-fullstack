class Queue {
    list = {};
    add(message) {
        let recipient = message.recipientID;
        if (!recipient)
            return;
        delete message.recipient;
    
        if (!this.list[recipient]) {
            this.list[recipient] = {messages: [], timer: 0};
        }
        this.list[recipient].messages.push(message);
    
        clearTimeout(this.list[recipient].timer);
        this.list[recipient].timer = setTimeout(() => {
            delete this.list[recipient];
        }, 15000);
    }
    delete(userID) {
        try { delete this.list[userID]; } catch {}
    }
}

class GCQueue {
    list = {};
    add(message) {
        let chatID = message.recipientID;
        delete message.recipient;
    
        if (!this.list[chatID]) {
            this.list[chatID] = {messages: [], timer: 0};
        }
        this.list[chatID]
        .messages.push({message: message, received: []});
        // P. S. в массив "received" попадают айди юзеров, получивших сообщение
    
        clearTimeout(this.list[chatID].timer);
        this.list[chatID].timer = setTimeout(() => {
            delete this.list[chatID];
        }, 15000);
    }
    get(userID) {
        const chatID = 0; // ВРЕМЕННО ЕСТЬ ТОЛЬКО ОДИН ГРУППОВОЙ ЧАТ, И ОН ИМЕЕТ АЙДИ 0
        if (!this.list[chatID] || !this.list[chatID].messages) return null;

        const messages = this.list[chatID].messages;
        const result = [];
        for (let i in messages) {
            if (messages[i].received.includes(userID))
                continue;
            messages[i].received.push(userID);
            result.push(messages[i].message);
        }
        return result.length
            ? result
            : null;
    }
}

export default {
    Queue, GCQueue
}