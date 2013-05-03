task 'test', 'Run the test suite', ->
  require('nodeunit').reporters.default.run ['./test']
    
task 'docs', 'Generate annotated source code with Docco', ->
  async = require 'async'
  fs = require 'fs'
  {print} = require 'util'
  {exec} = require 'child_process'
  genDocs = (root) ->
    fs.readdir root, (err, paths) ->
      async.forEach paths,
        (path, cb) ->
          fs.stat "#{root}/#{path}", (err, stat) ->
            if stat?.isDirectory()
              genDocs "#{root}/#{path}"
            else if /\.coffee$/.test path
              exec "docco #{root}/#{path}"
              cb()
        (err) ->
          console.error err if err?

  genDocs 'lib'
