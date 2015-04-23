This is a fork from : https://github.com/MattSkala/html5-bombergirl

The original game has the bots picking random moves.  We have built a state engine and add AI algorithms like Minimax to make the bots a lot smater and give them personalities.

Checkout the requirement for this project : https://d1b10bmlvqabco.cloudfront.net/attach/i26kvppj1oeww/i26kw6696su6ci/i7l81dc7moba/Donjon_Quest_%E2%80%93_project_description.pdf

============================
CS5100 - Direwolves Team
============================

We assume that you have an Ubuntu machine.

1. How to install?

Make sure you have `npm` and `bower` installed OR you can run the commands below to install them

```
apt-get install node
npm install -g bower
```

Go to the bomber girl project root and install the game dependenciese with `bower`
```
bower install
```

2. How to launch it?

Run command below in a shell
```
python -m SimpleHTTPServer 8000
```
and then open 127.0.0.1:8000 in your browser.
