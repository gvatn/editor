const WorkerPlugin = require('worker-plugin');

const withTM = require("next-transpile-modules")(["ot-slate"]);
module.exports = withTM({
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
        if (!isServer) {
            config.plugins.push(
                new WorkerPlugin({
                    // use "self" as the global object when receiving hot updates.
                    globalObject: 'self',
                })
            );
        }
        return config;
    }
});