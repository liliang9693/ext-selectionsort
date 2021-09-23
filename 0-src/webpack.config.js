const path = require('path');
const fs = require('fs');
const defaultsDeep = require('lodash.defaultsdeep');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin');

const base = {
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                include: [path.resolve(__dirname, 'src'), path.resolve(__dirname, 'examples')],
                options: {
                    babelrc: false,
                    plugins: [
                        "@babel/plugin-transform-runtime",
                        "@babel/plugin-transform-modules-commonjs"
                    ],
                    presets: ['@babel/preset-env']
                }
            },
            {
                test: /\.(png|svg|jpg|gif|jpeg|ico)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 819200
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new UglifyJsPlugin({
            sourceMap: true,
            parallel: 4,
            uglifyOptions: {
                mangle: false,
                keep_classnames: true,
                keep_fnames: true
            }
        })
    ]
}

module.exports = (function (){
    let arr = [
        defaultsDeep({}, base, {
            target: "electron-renderer",
            // mode: 'development',
            entry: './src/index.js',
            output: {
                libraryTarget: 'commonjs2',
                path: path.resolve(__dirname, 'build', 'template', 'javascript'),
                filename: '[name].js',
            },
            plugins: base.plugins.concat([
                new CopyWebpackPlugin({
                    patterns: [
                        {
                            from: path.resolve(__dirname, 'template','config.json'),
                            to: path.resolve(__dirname, 'build', 'template', 'config.json')
                        },
                        {
                            from: path.resolve(__dirname, 'template', 'javascript', '_images'),
                            to: path.resolve(__dirname, 'build', 'template', 'javascript', '_images')
                        }
                    ]
                })
            ])
        })
    ];
    if (process.env.NODE_ENV !== 'test') return arr;
    const examples = fs.readdirSync('./examples');
    return examples.reduce(function (total, item, index){
        console.log(path.resolve(__dirname, 'build', item, 'javascript'))
        total.push(defaultsDeep({}, base, {
            target: "electron-renderer",
            // mode: 'development',
            entry: path.resolve(__dirname, 'examples', item, 'index.js'),
            output: {
                libraryTarget: 'commonjs2',
                path: path.resolve(__dirname, 'build', item, 'javascript'),
                filename: 'main.js',
            },
            plugins: base.plugins.concat([
                new CopyWebpackPlugin({
                    patterns: [{
                        from: path.resolve(__dirname, 'examples', item, 'config.json'),
                        to: path.resolve(__dirname, 'build', item, 'config.json')
                    }]
                })
            ])
        }))
        return total
    }, [])
})();