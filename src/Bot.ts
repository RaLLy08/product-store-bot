export const TelegramBot = require('node-telegram-bot-api');
// const TelegramBot = require('node-telegram-bot-api');

// process.env.NTBA_FIX_319 = 1;
let bot = null;

export const initBot = token => {
    if (!bot) bot = new TelegramBot(token, { polling: true })
}

export const onMessage = cb => {     
    bot.on('message', (msg, match) => {
        cb(msg, match);
    }); 
}

export const sendMsgTo = (chatId: number) => (text, inline_keyboard?: any) => bot.sendMessage(chatId, text, inline_keyboard);

export const sendPhoto = (chatId: number, photo) => bot.sendPhoto(chatId, photo)

export const onQuery = cb => {
    bot.on('callback_query', query => {
        cb(query);
    }); 
}

export const deleteMessage = (chatId: number, messageId) => {
    bot.deleteMessage(chatId, messageId);
}

export const editMsg = (chat_id: number, message_id: number, text, inline_keyboard?: any) => {
    bot.editMessageText(text, {
        chat_id,
        message_id,
        // reply_markup: {
        //     inline_keyboard
        // }
    })
}

export const sendTag = (chatId: number, taggedMsg) => {
    bot.sendMessage(chatId, taggedMsg, {parse_mode : "markdown"});
}