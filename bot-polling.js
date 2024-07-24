const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const token = 'YOUR_TELEGRAM_BOT_TOKEN';
const bot = new TelegramBot(token, { polling: true });

const CHANNEL_ID = '@your_channel_id'; // Replace with your channel ID
let members = new Set(); // To keep track of current members
let welcomedMembers = new Set(); // To track members who have been welcomed
let joinedUsers = new Set(); // To keep track of users who have joined the channel

// Function to fetch channel members
const fetchChannelMembers = async () => {
  try {
    const response = await axios.get(`https://api.telegram.org/bot${token}/getChatAdministrators?chat_id=${CHANNEL_ID}`);
    const newMembers = response.data.result.map(member => member.user.id);

    // Detect new joiners
    const newJoiners = newMembers.filter(member => !members.has(member));
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

        // Send welcome messages only if the user has not been welcomed before
        if (!welcomedMembers.has(memberId)) {
          try {
            await bot.sendMessage(memberId, `Welcome to the channel ${CHANNEL_ID}!`);
            await bot.sendMessage(memberId, `Thank you for joining the channel ${CHANNEL_ID}!`);
            welcomedMembers.add(memberId); // Mark user as welcomed
          } catch (sendError) {
            console.error('Error sending welcome message:', sendError.message);
          }
        }

        // Add new joiner to the joinedUsers list
        joinedUsers.add(memberId);
      } catch (userInfoError) {
        console.error('Error fetching user info:', userInfoError.message);
      }
    });

    // Detect users who have left
    const leftMembers = [...members].filter(member => !newMembers.includes(member));
    leftMembers.forEach(async (memberId) => {
      try {
        // Attempt to send a goodbye message
        try {
          await bot.sendMessage(memberId, `We're sorry to see you leave the channel ${CHANNEL_ID}.`);
          console.log(`Sent goodbye message to user ID: ${memberId}`);
        } catch (leaveError) {
          console.error('Error sending goodbye message:', leaveError.message);
        }
        welcomedMembers.delete(memberId); // Remove user from welcomed list
        joinedUsers.delete(memberId); // Remove user from joinedUsers list
      } catch (error) {
        console.error('Error handling user leave:', error.message);
      }
    });

    // Update the members list
    members = new Set(newMembers);
  } catch (error) {
    console.error('Error fetching channel members:', error.message);
  }
};

// Polling interval to check for new members every minute
setInterval(fetchChannelMembers, 5000);

// Command to trigger joining instructions
bot.onText(/\/join_channel/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `Please join the channel using this link: https://t.me/${CHANNEL_ID}`);
});

// Command to get the list of joined users
bot.onText(/\/list_joined_users/, (msg) => {
  const chatId = msg.chat.id;
  if (joinedUsers.size === 0) {
    bot.sendMessage(chatId, 'No users have joined the channel yet.');
  } else {
    const userList = Array.from(joinedUsers).map(userId => `User ID: ${userId}`).join('\n');
    bot.sendMessage(chatId, `Users who have joined the channel:\n${userList}`);
  }
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
