//sends messages to tabs by id
//caches all messages until delivered, resends on ResendCached

export class Messaging {

    private messageCache = new Map<number, Message[]>();

    public async Send(
        tabId: number,
        args: any,
        onSuccess?: (response: any) => void,
        onTimeOut?: () => void) {

        const message = new Message(tabId, args);
        this.cacheMessage(message);

        //send message to tab, if it responds back call onSuccess
        //if it doesnt, call onTimeout
        try {
            
            const response = await Promise.race([
                chrome.tabs.sendMessage(tabId, message),
                new Promise((_: any, reject: any) => setTimeout(
                    () => reject(new Error('timeout')), this.reponseTime))
            ]);

            this.dropMessage(message);
            onSuccess?.(response);
        }

        catch (error: any) {
            if (error.message === "timeout")
                onTimeOut?.();
            this.dropMessage(message);
        }
    }

    cacheMessage(message: Message): Message[] {
        if (this.messageCache.get(message.tabId))
            this.messageCache.get(message.tabId)!.push(message);
        else
            this.messageCache.set(message.tabId, [message]);
        return this.messageCache.get(message.tabId)!;
    }

    dropMessage(message: Message) {
        const cachedMessages = this.messageCache.get(message.tabId);
        if (cachedMessages?.includes(message))
            cachedMessages.splice(cachedMessages.indexOf(message), 1);

    }

    public ResendCached(tabId: number) {
        const tabMessages = this.messageCache.get(tabId);
        this.messageCache.delete(tabId);
        tabMessages?.forEach((message) => this.Send(tabId, message));
    }

    private readonly reponseTime = 5000;
}

class Message {
    constructor(public tabId: number, args: any) {
        if (args)
            Object.assign(this, args);
    }
}

