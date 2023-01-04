module.exports = {
  plugins: ['inline-dotenv'],
  presets: [
    ['@babel/preset-env',
      { targets: { node: 'current' } }],
    '@babel/preset-typescript'
  ]
}
