const CDP = require('chrome-remote-interface');
const file = require('fs');

var shouldLog = (request) => {
    // TODO: modify this to capture desire requests
    return (true || request.url.indexOf('<part-of-url>') > -1);
};

// TODO: convert to async/await style
CDP((client) => {
    // extract domains
    const { Network, Page, Emulation, DOM } = client;

    // setup handlers
    Network.requestWillBeSent((params) => {
        if (shouldLog(params.request)) {
            console.log(params.request.url);
        }
    });
    Page.loadEventFired(() => {
        console.log('page.loadEventFired');

        // TODO: refer to https://medium.com/@dschnr/using-headless-chrome-as-an-automated-screenshot-tool-4b07dffba79a?1
        // to get correct width/height for screenshot
        let viewportWidth = 1200;
        let viewportHeight = 2000;
        
        Emulation.setVisibleSize({ width: viewportWidth, height: viewportHeight }).then(() => {
            const screenshot = Page.captureScreenshot({ format: 'png' }).then((screenshot) => {
                const buffer = new Buffer(screenshot.data, 'base64');

                file.writeFile('output.png', buffer, 'base64', function(err) {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log('Screenshot saved');
                    }
                });

                client.close();
            });
        });
    });

    // enable events then start!
    Promise.all([
        Network.enable(),
        Page.enable()
    ]).then(() => {
        Network.clearBrowserCache();
        Network.clearBrowserCookies();

        var url = process.argv[2];
        console.log('url: ' + url);
        return Page.navigate({ url: url });
    }).catch((err) => {
        console.error(err);
        client.close();
    });

}).on('error', (err) => {
    // cannot connect to the remote endpoint
    console.error(err);
});