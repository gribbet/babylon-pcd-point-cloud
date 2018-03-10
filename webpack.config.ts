import * as HtmlWebpackPlugin from "html-webpack-plugin";
import * as webpack from "webpack";

const configuration: webpack.Configuration = {
    context: `${__dirname}/source`,
    entry: "./index.ts",
    output: {
        path: `${__dirname}/build`,
        publicPath: "/"
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    module: {
        rules: [{
            test: /\.ts$/,
            exclude: /node_modules/,
            loader: "ts-loader"
        }]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "index.html"
        })
    ]
};

export default configuration;