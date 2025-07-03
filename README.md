# Custom public drawing canvas React App

This project was created with the goal to advertise myself as a solid candidate for software related positions by displaying links to my relevant personal profiles (e.g. GitHub, LinkedIn, etc.) while simultaneously showing off some of my skills as a developer through a straightforward React app with a slightly complicated code base.

Please note that this project was made with the intent of showing off my skills as a programmer, all packaged within an easily digestible initial experience through my own UI/UX on a streamlined custom web page. The functionality is all you-get-what-you-see, while still offering enough of a user experience that the development itself is noteworthy. This was not meant to be a highly complex project, as that would have defeated the purpose of a quick and effective display of skill. Hopefully you think it's cool, but I'm also very much aware that there is always room to grow, especially at my stage in my career.

# Guide to local app startup

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

This readme reviews how you can set up a local dev environment for this app

## Setting up the client

Within the client directory, you will need to install node package manager:

### `npm install`

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Make sure you run this command from within the client directory.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

Other standard npm commands also work for development purposes, of course.\
See the Create React App page for more info on those

Note that the canvas will not save anything between refreshes.\
This is because this project was built around using Netlify and Cloudinary,\
and was not meant to run exclusively locally. However, drawing functionality\
should still work without issue in a local environment.

Netlify hosts the web server and runs Netlify functions to make API calls\
to Cloudinary, which acts as a remote database to hold the canvas.

## Setting up the server

If you want to use Netlify, you will need to make sure Netlify functions are\
operational in order to make your API calls. This is achieved through the\
server.js file found in the client/netlify/functions/ directory. If you are\
running this locally, you will also need to install node.js within the\
aforementioned directory.

### `npm install node.js`

You can also run a local netlify environment to verify netlify functions are working.\
This can be achieved by installing netlify CLI locally with the following command.

### `npm install -g netlify-cli`

From there, you should be able to run the following command at the project root\
to get the netlify dev server started on your machine.

### `netlify dev`