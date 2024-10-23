const { dependencies } = require("./package.json");
module.exports = {
name: "login",
filename: "remoteEntry.js",
remotes: {},
exposes: {
    './login' : './src/App'
},
shared: {
    ...dependencies,
    react: {
      singleton: true,
      import: "react",
      shareScope: "default",
      requiredVersion: dependencies.react,
    },
    "react-dom": {
      singleton: true,
      requiredVersion: dependencies["react-dom"],
    },
  },
}
