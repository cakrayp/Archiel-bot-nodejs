/**
Discord Bot - Archiel Bot
A Discord bot that responds to specific messages from a target user with greeting and latency check functionalities.
Environment Variables Required:
    - TOKEN: Discord bot token for authentication
    - TARGET_USER_ID: User ID of the target user to respond to
    - MY_USER_ID: User ID of the bot owner for testing commands
Features:
    - Responds to greeting messages ('Hai', 'hai', 'Hi', 'hi') from target user
    - Provides latency check via 'ping'/'Ping'/'PING' commands (owner only)
    - Implements message cooldown to prevent spam (6-second delay between responses)
    - Logs all bot activities and received/sent messages
⚠️ DISCORD TERMS OF SERVICE (ToS) COMPLIANCE NOTES:
    - Ensure this bot complies with Discord's ToS (https://discord.com/terms)
    - Do NOT use this bot for:
        * Spam, harassment, or automated abuse
        * Violating user privacy or collecting personal data without consent
        * Circumventing Discord's security measures
        * Scraping or unauthorized data collection
    - Implement proper rate limiting to avoid API abuse
    - Respect user consent and obtain necessary permissions
    - Do not impersonate other users or services
    - Ensure the bot has appropriate intents configured in Discord Developer Portal
    - The 6-second cooldown is implemented to prevent excessive message flooding
Global Variables:
    - is_request_to_sent_message: Flag to prevent concurrent message sending during cooldown
Events:
    - client.on('ready'): Triggered when bot successfully connects to Discord
    - client.on('message'): Triggered when a message is received in any channel the bot can access
 */

const { Client } = require('discord.js-selfbot-v13');
const { loggerSetup, logLevels } = require('./lib/logger');
const { color, bgcolor } = require('./lib/color');
require('dotenv').config();

// Load environment variables
const TOKEN = process.env.TOKEN;
const TARGET_USER_ID = process.env.TARGET_USER_ID;
const MY_USER_ID = process.env.MY_USER_ID;

// Environment Variables Required:
//    - SAVE_LOGGER: Set to 'true' to enable logging to file, otherwise logs will only be printed to console
const SAVE_LOGGER = ['true', 'True'].includes(process.env.SAVE_LOGS);


// Import discord client and custom logger module
const client = new Client();
const { logger } = loggerSetup({
    use_color: true, // Enable colored output in console
    use_iso_date: true, // Use ISO date format for timestamps
    save_logger: SAVE_LOGGER // Enable saving logs to file based on environment variable,
});


// Start
let is_request_to_sent_message = false;   // Flag to prevent concurrent message sending during cooldown

client.on('ready', () => {
    logger(
        color("[BOT READY]:", "aqua"),
        `Logged in as "${client.user.username}" with ID "${client.user.id}"`
    );
    logger(color("[TIP]:", "aqua"), "Please say hi to Archiel");
});

client.on('message', async (message) => {
    // Log received message
    logger(
        color("[MESSAGE RECEIVED]:", "aqua"),
        `Message received from "${message.author.username}"` +
        `${(message.author.globalName != message.author.username && message.author.globalName != null) ? ` (${message.author.globalName})` : ''}`,
        `${message.content ? (`with content "${message.content}"`) : 'with no content'}`,
        `in server "${message.guild?.name ? message.guild.name : 'in Direct Message'}"`,
        `and ID "${message.author.id}"`
    );

    // Menghindari merespons pesan dari bot itu sendiri.
    if (message.author.id === client.user.id) return;

    // Menghindari pengiriman pesan berulang selama cooldown.
    if (is_request_to_sent_message) return;

    // Cek apakah pesan adalah perintah ping (hanya untuk pemilik bot)
    let isPingCommand = ['ping', 'Ping', 'PING'].includes(message.content);
    if (isPingCommand && message.author.id === MY_USER_ID) {
        is_request_to_sent_message = true;
        let latency = Date.now() - message.createdTimestamp;

        // Menyusun pesan latency dengan informasi tambahan seperti API latency, uptime, Node.js version, dan Discord.js version.
        let latencyText = "";
        latencyText += `**Pong!** Latency: ${latency}ms\n`;
        latencyText += `API Latency: ${client.ws.ping}ms\n`;
        latencyText += `Uptime: ${Math.floor(client.uptime / 1000)}s\n`;
        latencyText += `Node.js Version: ${process.version}\n`;
        latencyText += `Discord.js Version: ${require('discord.js-selfbot-v13').version}\n\n`;
        latencyText += `**Note:** This latency check is for testing purposes and may not reflect actual latency in production environments.`;
        latencyText = latencyText.trim(); // Remove any extra whitespace

        // Kirim pesan latency ke channel yang sama dengan pesan perintah ping.
        await message.channel.send(latencyText);

        logger(
            color("[MESSAGE SENT]:", "aqua"),
            color("[OWNER]:"),
            `Message has been sent to "${message.author.username}" with ID "${message.author.id}"`
        );

        // Set cooldown untuk mencegah pengiriman pesan berulang selama 6 detik.
        setTimeout(() => {
            is_request_to_sent_message = false;
        }, 6000);

        return; // Menghindari memproses logika lain setelah merespons perintah ping.
    };

    // Menghindari merespons pesan dari pengguna lain selain target user.
    if (message.author.id !== TARGET_USER_ID) return;

    // Cek apakah pesan adalah salam (Hai, hai, Hi, hi)
    let isGreeting = ['Hai', 'hai', 'Hi', 'hi'].includes(message.content);
    if (isGreeting) {
        is_request_to_sent_message = true;
        // Delay pengiriman pesan selama 6 detik untuk memberikan kesan "manusiawi" dan mencegah spam.
        setTimeout(async () => {
            let target_user_id = message.author.id;   // "TARGET_USER_ID" diambil dari environment variable, tetapi kita gunakan ID dari pesan yang diterima untuk memastikan respons yang tepat.
            let randomGreetings = [
                `Hai <@${target_user_id}>`,
                `Hai juga <@${target_user_id}>`,
                `Hai juga anomali <@${target_user_id}>`,
            ];
            let randomIndex = Math.floor(Math.random() * randomGreetings.length);
            let greetingMessage = (message.content.toLowerCase() === 'hi') ? randomGreetings[randomIndex].replace('Hai', 'Hi') : randomGreetings[randomIndex];
            await message.channel.send(greetingMessage);

            // Set cooldown untuk mencegah pengiriman pesan berulang.
            is_request_to_sent_message = false;

            // Log pesan yang telah dikirim sebagai respons terhadap salam.
            logger(
                color("[MESSAGE SENT]:", "aqua"),
                color("[TARGET USER]:"),
                `Message has been sent to "${message.author.username}" with ID "${message.author.id}"`
            );
        }, 6000);

        return; // Menghindari memproses logika lain setelah merespons salam.
    };
});


client.login(TOKEN);