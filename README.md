# Code Your Way In

A Node.js application using MongoDB and the new Arena websockets server. Automatically logs a user in with their topcoder account if cookie found.

### Requirements

There is an issue with the sockets protocol and HTTPS in node 0.10.29. Therefore you will need to **use 0.10.28** to connect to the Arena server successfully.

## Local Development

Right now there's is no way to authenticate easily against topcoder. Therefore, the code looks for their tcjwt cookie and if found, creates a user in Mongo and logs them into the app. You'll need to set the cookie locally with the following from Chrome Dev Console:

```
$.cookie('tcjwt','THE-VALUE-OF-THE-COOKIE')
```
To get started developing, start MondoDB and ...

```
# clone this repo locally
npm install
source environment.sh
node app.js
```
