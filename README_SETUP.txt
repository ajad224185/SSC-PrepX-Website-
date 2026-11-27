SSC PrepX Support Team integration

Files:
- index.html: Updated homepage. GOV CENTRE button is replaced with Support Team and opens a support popup.
- api/support.js: Vercel serverless endpoint that forwards submissions to your Telegram bot.

Important setup:
1. Deploy this folder structure to Vercel. Keep api/support.js at the project root inside the api folder (same level as index.html).
2. In Telegram, create a bot with @BotFather.
3. Start a private chat with your bot and send /start. To receive messages in a group, add the bot to that group and use the group's chat ID.
4. Set these environment variables in Vercel > Project > Settings > Environment Variables:
   TELEGRAM_BOT_TOKEN = your bot token
   TELEGRAM_CHAT_ID = your personal chat ID or group chat ID
5. Redeploy the project after adding/changing environment variables.

Security:
- Do NOT put the bot token in index.html or any public JavaScript.
- Do NOT share your bot token in chat or commit it to GitHub.
- Optional Telegram username and email are user-entered contact details, not independently verified identities.
- Screenshot upload is optional and limited to images up to 3 MB.

The API uses Vercel Node serverless functions (Node.js 18+ for fetch/FormData/Blob).
