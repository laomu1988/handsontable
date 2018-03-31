/**
 * @file 前端文件打包配置
 */

const path = require('path')
const webpack = require('webpack')
const env = process.env.NODE_ENV || 'dev'
const isProd = env === 'prod'
const hash = env === 'prod' ? '.[hash]' : ''
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const plugins = [
    new HtmlWebpackPlugin({
        template: './src/index.ejs',
        filename: 'index.html',
        chunks: ['common', 'table', 'example']
    }),
    new webpack.optimize.CommonsChunkPlugin({
        name: 'common',
        chunks: ['table', 'example'],
        filename: 'common.js',
    })
]
if (isProd) {
    plugins.unshift(new UglifyJSPlugin())
}

module.exports = {
    devtool: 'inline-source-map',
    entry: {
        table: './src/table.js',
        example: './src/example.js',
        // vendor: ['./src/index.js']
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name]' + '.js',
        chunkFilename: '[id]' + hash + '.chunk.js'
    },
    externals: [{'fs': 'null'}],
    module: {
        noParse: [/.*\.min\.js/],
        rules: [
            {
                test: /\.css$/,
                use: [
                    { loader: 'style-loader' },
                    { loader: 'css-loader' }
                ]
            },
            {
                test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'
            },
            {
                test: /\.(png|jpe?g|gif)$/,
                use: 'url-loader?limit=8192&name=assets/img/[name].[ext]' + hash
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2)$/,
                use: 'url-loader?limit=10000&name=assets/fonts/[name].[ext]'
            },
        ]
    },
    resolve: {
        alias: {
            '~': path.resolve(__dirname, 'src')
        }
    },
    plugins: plugins,
    devServer: {
        // contentBase: [path.join(__dirname, 'dist')],
        host: '127.0.0.1',
        disableHostCheck: true,
        port: 8021
    }
}
