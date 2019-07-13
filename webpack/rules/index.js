const manifest = require("../manifest");

module.exports = [
  // vue
  // {
  //   test: /\.vue$/,
  //   loader: 'vue-loader',
  //   options: {
  //     loaders: {
  //       js: 'babel-loader'
  //     }
  //   }
  // },

  // preact

  // {
  // 	test: /\.jsx?$/,
  // 	exclude: manifest.paths.src,
  // 	enforce: 'pre',
  // 	use: 'source-map-loader'
  // },
  // {
  // 	test: /\.jsx?$/,
  // 	exclude: /node_modules/,
  // 	use: 'babel-loader'
  // },

  {
    test: /\.svelte$/,
    exclude: /node_modules/,
    use: {
      loader: "svelte-loader",
      options: {
        emitCss: true,
        hotReload: true
      }
    }
  },

  // js
  {
    test: /\.(js)$/,
    exclude: /(node_modules|build|dist\/)/,
    use: [
      {
        loader: "babel-loader",
        options: {
          presets: [
            [
              "@babel/preset-env",
              {
                targets: {
                  browsers: ["last 2 versions", "> 2%"]
                },
                exclude: ["transform-classes"]
              }
            ]
          ],
          plugins: [
            "@babel/plugin-proposal-class-properties",
            "@babel/plugin-proposal-object-rest-spread",
            "@babel/plugin-syntax-dynamic-import",
            // "transform-custom-element-classes",
            // ["@babel/plugin-transform-react-jsx", { pragma: "h" }],
            // "babel-plugin-transform-object-rest-spread",
            "@babel/plugin-transform-arrow-functions"
            // "@babel/plugin-proposal-class-properties",
            // "@babel/plugin-syntax-dynamic-import"
          ]
        }
      }
    ]
  },

  // image
  {
    test: /\.(png|gif|jpg|svg)$/i,
    use: [
      {
        loader: "file-loader?limit=2000",
        options: {
          outputPath: "images"
        }
      }
    ]
  },
  require("./css"),
  require("./sass"),

  // fonts
  {
    test: /\.(eot|ttf|woff|woff2)$/,
    //  exclude: /(node_modules)/,
    use: {
      loader: "file-loader?limit=30000",
      options: {
        outputPath: "fonts"
      }
    }
  }
];
