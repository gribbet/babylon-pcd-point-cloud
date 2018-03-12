import * as HtmlWebpackPlugin from "html-webpack-plugin";
import * as webpack from "webpack";

const configuration: webpack.Configuration = {
    context: `${__dirname}/source`,
    devtool: "source-map",
    entry: "./index.ts",
    module: {
        rules: [
            {
                exclude: /node_modules/,
                loader: "ts-loader",
                test: /\.ts$/
            },
            {
                loader: "file-loader",
                test: /\.pcd$/
            }
        ]
    },
    output: {
        path: `${__dirname}/build`,
        publicPath: "/"
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "index.html"
        })
    ],
    resolve: {
        extensions: [".ts", ".js"]
    }
};

export default configuration;
