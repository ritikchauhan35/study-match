# Match My Study

A real-time study partner matching application that helps students find study partners based on shared subjects.

## Project info

**URL**: https://lovable.dev/projects/4e6eb422-349f-4ad5-8cb3-6dcbf04e4d5b

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/4e6eb422-349f-4ad5-8cb3-6dcbf04e4d5b) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Configure environment variables
# Create a .env file in the root directory with the following variables:
# VITE_MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
# VITE_SOCKET_PORT=3001
# VITE_SOCKET_SERVER_URL=http://localhost:3001

# Step 5: Start the development server with auto-reloading and an instant preview.
# This will start both the frontend and Socket.IO server
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- MongoDB for database storage
- Socket.IO for real-time features
- Express for backend server

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/4e6eb422-349f-4ad5-8cb3-6dcbf04e4d5b) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## MongoDB and Socket.IO Implementation

This project has been migrated from Supabase to use MongoDB for data storage and Socket.IO for real-time features. The migration preserves all functionality while providing more control over the backend implementation.

### Features

- **MongoDB Integration**: Stores lobbies, messages, and user data
- **Socket.IO Real-time**: Handles presence tracking and real-time messaging
- **Express Backend**: Serves the Socket.IO server

### Running the Socket.IO Server

The Socket.IO server is automatically started when running `npm run dev`. You can also run it separately with:

```sh
npm run server
```
