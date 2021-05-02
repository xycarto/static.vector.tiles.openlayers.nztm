const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {    
    entry: './src/app.js',
    output: {
            path: __dirname + '/dist/build',
            filename: 'bundle.js',
    },
    devServer: {
            contentBase: path.join(__dirname, 'src'),
            port: 8000,
            watchContentBase: true,
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: [
                    'style-loader',
                    'css-loader',
                ]
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'src/index.html'
        })
    ]
}

    