# Custom public drawing canvas React App

This project was created with the goal to advertise myself as a solid candidate for software related positions by displaying links to my relevant personal profiles (e.g. GitHub, LinkedIn, etc.) while simultaneously showing off some of my skills as a developer through a straightforward React app with a slightly complicated code base.

Please note that this project was made with the intent of showing off my skills as a programmer, all packaged within an easily digestible initial experience through my own UI/UX on a streamlined custom web page. The functionality is all you-get-what-you-see, while still offering enough of a user experience that the development itself is noteworthy. This was not meant to be a highly complex project, as that would have defeated the purpose of a quick and effective display of skill. Hopefully you think it's cool, but I'm also very much aware that there is always room to grow, especially at my stage in my career.

# Guide to local app startup

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

This readme reviews how you can set up a local dev environment for this app

## Setting up the client

Within the client directory, you will need to install a few react dependencies:

### `npm install [dependency]`

- react-color\
- node-fetch

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Make sure you run this command from within the client directory.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

Other standard npm commands also work for development purposes, of course.\
See the Create React App page for more info on those

## Setting up the server

The server is required for other clients to be able to see changes made to the canvas.\
This is how users are able to make drawings on the canvas that other users can see on their own machines.

Within the server directory, you will need to install a few react dependencies:

### `npm install [dependency]`

- cors\
- multer

You will then need to run the actual server.

### `node server.js`

Runs the server portion of the app on port 3001 (note the app itself is run on port 3000).\
Make sure you run this command from within the server directory.
