# Generate APP_SECRET

```
openssl rand -base64 32
```

# Add Cité d\'orBot to your Discord Server

```
https://discord.com/api/oauth2/authorize?client_id=BOT_CLIENT_ID&scope=bot&permissions=8
```

# Deploy to production

```
npm run initialize
npm run build
```