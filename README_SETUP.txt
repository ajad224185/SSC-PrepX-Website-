SSC PrepX Support Team + Digital Timer setup

1. Upload the complete folder contents to the root of your GitHub/Vercel project.
2. Keep the existing Firebase files and folders (especially js/firebase.js) in place.
3. Create a separate Telegram bot for Support using @BotFather and add it to your support group.
4. In Vercel > Project > Settings > Environment Variables, add:
   SUPPORT_BOT_TOKEN = token of the NEW Support bot
   SUPPORT_CHAT_ID  = -1005943726863
5. Redeploy the Vercel project.

The existing Admin Panel bot environment variables are not changed.

Support form:
- Name and email are taken from the currently signed-in Firebase account/profile.
- Telegram User ID is included only if it is already saved in the Firebase users/{uid} profile under telegramUserId, telegram_user_id, or telegramId.
- A normal Firebase login does NOT reveal a person's Telegram User ID. To populate it automatically, you must separately add an official Telegram Login/linking flow and save its verified ID to that user's Firebase profile.
- If no Firebase user is signed in, name/email may show as unavailable.
- Problem description is required; screenshot is optional (image up to 3 MB).

Digital Timer is a stopwatch with Start/Pause/Resume/Reset.

Security note: never put bot tokens in index.html or commit them to GitHub.
