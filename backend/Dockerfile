FROM node:16

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY npm-shrinkwrap.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Set environment variables from .env file
ENV DATABASE_URL=${DATABASE_URL}
ENV SUPABASE_URL=${SUPABASE_URL}
ENV SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
ENV SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
ENV STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
ENV STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY}
ENV NODE_ENV=${NODE_ENV}
ENV PORT=${PORT}
ENV FRONTEND_URL=${FRONTEND_URL}
ENV SUPABASE_JWT_SECRET=${SUPABASE_JWT_SECRET}

# Expose the port the app runs on
EXPOSE ${PORT}

# Start the application
CMD ["npm", "start"]