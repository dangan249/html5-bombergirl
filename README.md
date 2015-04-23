This is a fork from : https://github.com/MattSkala/html5-bombergirl

The original game has the bots picking random moves.  We have built a state engine and add AI algorithms like Minimax to make the bots a lot smater and give them personalities.

============================
          CS5100
        Direwolves
============================

We assume that you have an Ubuntu machine.

1. How to install?

Install `node.js` using command
```
apt-get install node
```
This should install `npm` together with `node`.

Install `bower` using command

```
npm install -g bower
```

Go to bomber girl root.
Install front-end libraries using command

```
bower install
```

2. How to launch it?

Run command
```
python -m SimpleHTTPServer 8000
```
through shell, and then open 127.0.0.1:8000 in your browser.
