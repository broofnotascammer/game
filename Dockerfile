# This file tells Render how to set up your "Whiteboard" server

# 1. Start with a Node.js environment (like getting a clean desk with Node.js pre-installed)
FROM node:20-alpine

# 2. Set the working folder inside this environment to /app
WORKDIR /app

# 3. Copy just the project description and dependencies list first
# This helps Docker be faster if only your code changes, not dependencies
COPY package*.json ./

# 4. Install all the dependencies (like installing your tools: express, socket.io)
RUN npm install

# 5. Copy all your server code into the environment
COPY . .

# 6. Inform Docker that our app will listen on port 10000 (Render's usual port)
EXPOSE 10000 

# 7. Tell Docker how to start your server when it runs
CMD ["node", "server.js"]