web enabled bathroom
====================

a simple node/websockets chat built off from [jsChat](https://github.com/jennschiffer/jsChat) for [art hack day](http://www.arthackday.net/events/deluge)


### Install

1. add files to some directory on your server [node must be installed](http://nodejs.org/download/).

2. go into the jschat directory and install dependencies by running: <code>npm install</code> (dependencies: express, socket.io, sqlite3)

3. to start chat server, run <code>npm start</code>

4. direct your browser to <code>localhost:3000</code>.

### Notes 

1. if you are running for the first time, <code>jschat.db</code> will be created with a user <code>{ nickname: root, password: root}</code>

2. works on browsers that support [socket.io](http://socket.io/#browser-support)