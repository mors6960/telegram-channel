const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const token = '6549070771:AAGmJMkRK7zCfejSv5hhfMyy7LzhZduOdsA';
const bot = new TelegramBot(token, { polling: true });

const CHANNEL_ID = '@MorShubham'; // Replace with your channel ID
let members = [];

// Function to fetch channel members
const fetchChannelMembers = async () => {
  try {
    const response = await axios.get(`https://api.telegram.org/bot${token}/getChatAdministrators?chat_id=${CHANNEL_ID}`);
    const newMembers = response.data.result.map(member => member.user.id);

    // Check for new members
    const newJoiners = newMembers.filter(member => !members.includes(member));
    if (newJoiners.length) {
      newJoiners.forEach(async (memberId) => {
        try {
          const userInfo = await axios.get(`https://api.telegram.org/bot${token}/getChatMember?chat_id=${CHANNEL_ID}&user_id=${memberId}`);
          const user = userInfo.data.result.user;
          
          if (user.is_bot) {
            console.log(`Skipping bot: ${user.username}`);
            return;
          }

          const username = user.username || 'No username';
          console.log(`New member: ${username}`);

          await bot.sendMessage(memberId, `Welcome to the channel ${CHANNEL_ID}!`);
          await bot.sendMessage(memberId, `Thank you for joining the channel ${CHANNEL_ID}!`);
        } catch (error) {
          console.error('Error fetching user info or sending message:', error.message);
        }
      });
    }

    // Update the members list
    members = newMembers;
  } catch (error) {
    console.error('Error fetching channel members:', error.message);
  }
};

// Polling interval to check for new members every minute
setInterval(fetchChannelMembers, 60000);

// Command to trigger joining instructions
bot.onText(/\/join_channel/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `Please join the channel using this link: https://t.me/${CHANNEL_ID}`);
});

// Callback handling example
bot.on('callback_query', (callbackQuery) => {
  const message = callbackQuery.message;
  bot.sendMessage(message.chat.id, 'Callback received!');
});

// Start the bot and provide the channel link
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `Welcome to the bot! Use /join_channel to join the channel. Please join the channel using this link: https://t.me/${CHANNEL_ID}`);
});
