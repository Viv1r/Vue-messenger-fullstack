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
}

export default {
    Queue
}