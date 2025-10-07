Install Node.js
# In your project folder (the one with package.json)
npm ci

# Prisma needs DATABASE_URL in .env (not .env.local)
notepad .env
# paste:
# DATABASE_URL="file:./dev.db"

# App envs for Next.js (in .env.local)
notepad .env.local
# paste:
# DATABASE_URL="file:./dev.db"
# NEXTAUTH_SECRET="dev_secret_change_me"
# NEXTAUTH_URL="http://localhost:3000"
# RDP_TOKEN_SECRET="rdp_secret_change_me"

npx prisma generate
npx prisma migrate dev --name init
Run
npm run dev
# if the port is busy:
$env:PORT=3001; npm run dev
