const { src, dest, parallel, series, watch } = require('gulp')
// 可以加载所有的gulp插件
const loadPlugins = require('gulp-load-plugins')

const cwd = process.cwd()
let config = {
  // default config
  build: {
    src: 'src',
    dist: 'dist',
    temp: 'temp',
    public: 'public',
    paths: {
      styles: 'assets/styles/*.scss',
      scripts: 'assets/scripts/*.js',
      pages: '*.html',
      images: 'assets/images/**',
      fonts: 'assets/fonts/**',
    }
  }
}
try {
  const loadConfig = require(`${cwd}/pages.config.js`)
  config = Object.assign({}, config, loadConfig)
} catch (e) {}

// 删除文件
const del = require('del')
const clean = () => {
  return del([config.build.dist, config.build.temp])
}

// 使用plugins.babel()
const plugins = loadPlugins()
const sass = require('gulp-sass')(require('sass'))
const style = () => {
  return src(config.build.paths.styles, { base: config.build.src, cwd: config.build.src })
    .pipe(sass())
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}

// const babel = require('gulp-babel')
const script = () => {
  return src(config.build.paths.scripts, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.babel({ presets: [require('@babel/preset-env')] }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}


// const swig = require('gulp-swig')
const page = () => {
  // 如果子目录下也有需要编译的html文件，使用/src/**/*.html
  return src(config.build.paths.pages, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.swig({ data: config.data }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}

// const imagemin = require('gulp-imagemin')
// 图片
const image = () => {
  return src(config.build.paths.images, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}
// 字体
const font = () => {
  return src(config.build.paths.fonts, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}

// 其他文件
const extra = () => {
  return src('**', { base: config.build.public, cwd: config.build.public })
    .pipe(dest(config.build.dist))
}

const browserSync = require('browser-sync')
const bs = browserSync.create()
const serve = () => {
  // gulp提供的watch方法，解构出来就可以使用，第一个参数是路径，第二个参数是变化后执行的任务
  watch(config.build.paths.styles, { cwd: config.build.src }, style)
  watch(config.build.paths.scripts, { cwd: config.build.src }, script)
  watch(config.build.paths.pages, { cwd: config.build.src }, page)
  // watch('src/assets/images/**', image)
  // watch('src/assets/fonts/**', font)
  // watch('public/**', extra)
  // 优化一下，下面三个路径中的文件变化，引起浏览器重新请求资源
  watch([
    config.build.paths.images,
    config.build.paths.fonts
  ], { cwd: config.build.src }, bs.reload)
  watch('**', { cwd: config.build.public }, bs.reload)

  bs.init({
    notify: false,
    port: 2080,
    open: false,
    // ，这个配置也可以在每个任务执行完写入后调用.pipe(bs.reload({ stream: true }))方式代替
    // files: 'dist/**', // 监听的路径通配符
    server: {
      // 按照顺序依次查找文件
      baseDir: [config.build.temp, config.build.dist, config.build.public],
      routes: {
        // 映射
        '/node_modules': 'node_modules'
      }
    }
  })
}

const useref = () => {
  return src(config.build.paths.pages, { base: config.build.temp, cwd: config.build.temp })
    .pipe(plugins.useref({ searchPath: [config.build.temp, '.'] }))
    // 会有三种情况的文件：html js css 分别压缩
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true
    })))
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    // 避免文件写入冲突，加个中转站
    .pipe(dest(config.build.dist))
}

// compile处理需要编译的文件,image, font, extra开发阶段没有执行的必要，所以放在build中
const compile = parallel(style, script, page)
// 上线之前执行的任务
const build = series(clean, parallel(series(compile, useref), image, font, extra))
const develop = series(compile, serve)

module.exports = {
  build,
  develop,
  clean
}
