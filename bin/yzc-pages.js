#!/usr/bin/env node
process.argv.push('--cwd')
process.argv.push(process.cwd())
process.argv.push('--gulpfile')
process.argv.push(require.resolve('..'))
// process.argv 可以拿到执行命令的参数，也可以push参数
console.log(process.argv)

require('gulp/bin/gulp')
