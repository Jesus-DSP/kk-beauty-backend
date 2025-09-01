FROM node:16

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY npm-shrinkwrap.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
