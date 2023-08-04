const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: './',
  pages: {
    index: {
      entry: 'src/main.ts',
      title: 'vrma-loader-sample',
    }
  }  
})
