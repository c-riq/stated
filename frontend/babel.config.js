const presets = [
    [
      "@babel/preset-env",
      {
        targets: {
          edge: "17",
          firefox: "60",
          chrome: "67",
          safari: "11.1",
        },
        useBuiltIns: "usage",
        corejs: "3.6.4",
      }
    ],
    "@babel/react",
    "@babel/preset-typescript"
  ];

const plugins = [
    "@babel/plugin-proposal-class-properties"
];

module.exports = { presets, plugins };
