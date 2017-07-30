const CDP = require('chrome-remote-interface');

var shouldLog = (request) => {
    return (request.url.indexOf('metrics.kbb.com') > -1);
};

CDP((client) => {
    // extract domains
    const {Network, Page} = client;
    // setup handlers
    Network.requestWillBeSent((params) => {
        if (shouldLog(params.request)) {
            console.log(params.request.url);
        }
    });
    Page.loadEventFired(() => {
        console.log('page.loadEventFired');
        client.close();
    });
    // enable events then start!
    Promise.all([
        Network.enable(),
        Page.enable()
    ]).then(() => {
        var url = 'https://www.kbb.com' + process.argv[2];
        console.log('url: ' + url);
        return Page.navigate({url: url});
    }).catch((err) => {
        console.error(err);
        client.close();
    });
}).on('error', (err) => {
    // cannot connect to the remote endpoint
    console.error(err);
});
