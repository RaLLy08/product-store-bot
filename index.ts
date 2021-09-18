require("dotenv").config();
import * as TelegramBot from "node-telegram-bot-api";
//  {
//      userId:
//      channels: []
//  }
type Channels = Array<string>
type Cart = Array<string>


type UserChannels = {
    userId: number;
    channels: Channels;
};

class BotStore {
    store: Array<UserChannels>;
    constructor() {
        this.store = [];
    }

    getSubscribedChannels(userId: number): Channels {
        const user = this.store.find((el) => el.userId === userId);
        const channels: Channels = user?.channels || [];

        return channels;
    }

    subscribeChannelsToUser(userId: number, channels): void {
        this.store.push({
            userId,
            channels,
        });
    }
}

type UserCart = {
    userId: number;
    cart: Cart;
};
class CustumersStore {
    store: any;
    constructor() {
        this.store = [];
    }

    addToUserCart(userId: number, order: string): void {
        const user: UserCart | undefined = this.store.find(
            (user: UserCart) => user.userId === userId
        );

        if (user) {
            user.cart.push(
                order
            );
            return;
        } 

        this.store.push({
            userId,
            cart: [order]
        });
    }

    getUserCart(userId: number): Cart {
        const user = this.store.find(user => user.userId === userId);
        const cart = user ? user.cart : [];

        return cart
    }
}

const botStore = new BotStore();
const custumersStore = new CustumersStore();

const init = () => {
    const token = process.env.TELEGRAM_TOKEN;

    if (!token) {
        throw new Error("Telegram token not found");
    }

    const bot = new TelegramBot(token, { polling: true });

    bot.onText(/\/start/, (msg) => {
        // listens for "/start" and responds with the greeting below.
        bot.sendMessage(
            msg.chat.id,
            "What does this bot? - This bot broadcast orders to all subscribed channels. \nSet me in the channel(s) as administrator and then send me a channel or channels name(s) please"
        );
    });

    bot.on("callback_query", (query) => {
        if (query?.message?.text && query.data === "add") {
            custumersStore.addToUserCart(query.from.id, query.message.text);
        }

        if (query.message && query.data === "checkout") {
            const cart = custumersStore.getUserCart(query.from.id);

            if (cart.length) {
                bot.sendMessage(query.message.chat.id, cart.toString(), {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "pay",
                                    callback_data: "pay",
                                },
                            ],
                        ],
                    },
                });
            }
        }

        if (query.message && query.data === "pay") {
            bot.sendMessage(query.message.chat.id, "Done");
        }
    });

    bot.on("message", async (msg: TelegramBot.Message) => {
        if (msg.text && msg.text.includes('showcart')) {
            const cart = msg.from && custumersStore.getUserCart(msg.from.id);
            
            if (cart?.length) {
                bot.sendMessage(msg.chat.id, cart.toString(), {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "checkout",
                                    callback_data: "checkout",
                                },
                            ],
                        ],
                    },
                });
            } 

            return
        }


        const mentions: Array<TelegramBot.MessageEntity> =
            msg.entities?.filter((el) => el.type === "mention") || [];
        
        const subscribedChannels =
            msg.from && botStore.getSubscribedChannels(msg.from.id);

        if (msg.text && subscribedChannels?.length) {
            for (const channelName of subscribedChannels) {
                await bot.sendMessage("@" + channelName, msg.text, {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "show cart",
                                    url: `https://t.me/product_store_bot?start=showcart`,
                                },
                                {
                                    text: "add to cart",
                                    callback_data: "add",
                                },
                            ],
                        ],
                    },
                });
            }

            bot.sendMessage(
                msg.chat.id,
                "Product sended to channels",
            );

            return;
        }

        if (mentions.length && msg.text) {
            const adminInChannels: Array<string> = [];
            const notAdminInChannels: Array<string> = [];
            const { username: botUsername } = await bot.getMe();

            for (const mention of mentions) {
                const { offset, length } = mention;
                const channelName: string = msg.text.substring(
                    offset + 1,
                    offset + length
                );
                const channelId = "@" + channelName;

                try {
                    const admins: TelegramBot.ChatMember[] =
                        await bot.getChatAdministrators(channelId);

                    admins.some(
                        ({ user: { username } }) => username === botUsername
                    ) && adminInChannels.push(channelName);
                } catch (err) {
                    notAdminInChannels.push(channelName);
                }
            }

            if (adminInChannels.length) {
                msg.from &&
                    botStore.subscribeChannelsToUser(msg.from.id, adminInChannels);

                await bot.sendMessage(
                    msg.chat.id,
                    `Bot successfully had been subscribed to channel(s) ${adminInChannels}`
                );
            }

            if (notAdminInChannels.length) {
                await bot.sendMessage(
                    msg.chat.id,
                    `Bot was not admin in channel(s): ${notAdminInChannels}`
                );
            }
        } else {
            bot.sendMessage(msg.chat.id, "Please write correct channel name");
        }
    });
};

init();


// class UserCart {

// }

// class UserChannels {

// }
// class Bot {

// }