const ModuleFederationPlugin = require("webpack").container.ModuleFederationPlugin;
const path = require("path");

module.exports = {
  entry: "./src/index.js", 
  mode: "development", 
  output: {
    publicPath: "auto", 
    path: path.resolve(__dirname, "dist"), 
    filename: "bundle.js", 
  },
  devServer: {
    port: 3001, 
    contentBase: path.join(__dirname, "dist"), 
    hot: true, 
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "login", 
      filename: "remoteEntry.js", 
      exposes: {
        "./login": "./src/Course",
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: "^17.0.2", 
        },
        "react-dom": {
          singleton: true,
          requiredVersion: "^17.0.2", 
        },
      },
    }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/, 
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-react"], 
          },
        },
      },
    ],
  },
};
