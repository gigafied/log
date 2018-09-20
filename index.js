(function (root) {
  'use strict'

  root.process = root.process || {}
  root.process.env = root.process.env || {}

  var levels = ['critical', 'error', 'warn', 'info', 'verbose', 'debug', 'silly']

  var namespaces = {
    default: process.env.LOG_LEVEL || 3
  }

  var themes = {
    dark: {
      critical: ['color: #FFF', 'color: #FFF'],
      error: ['color: #FFF', 'color: #DDD'],
      warn: ['color: #FD9327', 'color: #DDD'],
      info: ['color: #66D9EF', 'color: #DDD'],
      verbose: ['color: #A6E22D', 'color: #AAA'],
      debug: ['color: #777', 'color: #888'],
      silly: ['color: #555', 'color: #666'],
      time: ['color: #AAA; font-size: 9px'],
      level: ['color: #444; font-size: 0px']
    },
    light: {
      critical: ['color: #F00', 'color: #F00'],
      error: ['color: #F00', 'color: #F00'],
      warn: ['color: #FD9327', 'color: #FD9327'],
      info: ['color: #66D9EF', 'color: #111'],
      verbose: ['color: #A6E22D', 'color: #444'],
      debug: ['color: #666', 'color: #666'],
      silly: ['color: #888', 'color: #999'],
      time: ['color: #AAA; font-size: 9px'],
      level: ['color: #444; font-size: 0px']
    }
  }
  var theme = process.env.LOG_THEME || 'light'
  var isMuted = false
  var doLogTimes = true
  var handlers = []

  function getTimeString () {
    var d = new Date()
    return d.toLocaleDateString() + ' @ ' + d.toTimeString().substr(0, 8) + '.' + d.getMilliseconds()
  }

  function shouldLog (namespace, level) {
    var activeLevel = namespaces[namespace]
    if (typeof activeLevel === 'undefined') activeLevel = namespaces.default
    if (activeLevel >= level) return true
    return false
  }

  function wrapConsole (level, method) {
    var levelIdx = levels.indexOf(level)
    return function (namespace, msg) {
      var i, log, args, logArgs
      var styles = logger.themes[theme]
      if (isMuted || !shouldLog(namespace, levelIdx) || !(log = root.console && root.console[method])) return
      args = Array.prototype.slice.call(arguments, 2)
      if (namespace && typeof msg === 'undefined') {
        msg = namespace
        namespace = 'none'
      }
      if (msg instanceof Error) {
        args.unshift(msg)
        msg = ''
      }

      logArgs = [
        (doLogTimes ? '%c' + getTimeString() + ' - ' : '') + '%c(' + level + ') ' + '%c[' + namespace + ']%c : ' + msg
      ]

      if (doLogTimes) logArgs = logArgs.concat(styles.time, styles.level, styles[level])
      else logArgs = logArgs.concat(styles.level, styles[level])

      log.apply(root.console, logArgs.concat(args))
      for (i = 0; i < handlers.length; i++) handlers[i].apply(null, [level, namespace, msg].concat(args))
    }
  }

  function setLevel (namespace, level) {
    var p
    if (typeof level === 'string') level = levels.indexOf(level)
    if (!~level) throw new Error('Invalid level: ' + arguments[1])
    if (namespace === '*') {
      for (p in namespaces) namespaces[p] = level
      return
    }
    namespaces[namespace] = level
  }

  function setLevels (obj) {
    var p
    for (p in obj) setLevel(p, obj[p])
  }

  function addHandler (handler) {
    handlers.push(handler)
  }

  function wrap (namespace) {
    var i, level
    var isMuted = false
    var ret = {
      setLevel: function (level) {
        logger.setLevel(namespace, level)
      },
      mute: function () { isMuted = true },
      unmute: function () { isMuted = false }
    }

    function doWrap (level) {
      return function () {
        if (isMuted) return
        logger[level].apply(null, [namespace].concat([].slice.call(arguments)))
      }
    }
    for (i = 0; i < levels.length; i++) {
      level = levels[i]
      ret[level] = doWrap(level, logger[level])
    }
    return ret
  }

  function setTheme (val) {
    if (typeof val === 'string') {
      if (!themes[val]) throw new Error('Invalid theme: ' + theme)
      theme = val
    } else {
      themes.custom = val
      theme = 'custom'
    }
  }

  var logger = {
    critical: wrapConsole('critical', 'error'),
    error: wrapConsole('error', 'error'),
    warn: wrapConsole('warn', 'warn'),
    info: wrapConsole('info', 'info'),
    verbose: wrapConsole('verbose', 'log'),
    debug: wrapConsole('debug', 'debug'),
    silly: wrapConsole('silly', 'debug'),
    setLevel: setLevel,
    setLevels: setLevels,
    addHandler: addHandler,
    mute: function () { isMuted = true },
    unmute: function () { isMuted = false },
    enableTimes: function () { dologgerTimes = true },
    disableTimes: function () { dologgerTimes = false },
    wrap: wrap,
    themes: themes,
    levels: namespaces,
    runTest: runTest,
    setTheme: setTheme
  }

  function runTest () {
    var before = namespaces
    namespaces = {default: 6}
    logger.critical('test', 'Some critical issue...')
    logger.error('test', new Error('There was an error'))
    logger.warn('test', 'I\'m warning you!')
    logger.info('test', 'The quick brown fox')
    logger.verbose('test', 'well, I do say...')
    logger.debug('test', 'jumped over the lazy dog')
    logger.silly('test', 'Everyday I\'m shuffling')
    namespaces.default = before
  }

  if (typeof define === 'function' && define.amd) define([], logger)
  else if (typeof module !== 'undefined' && module.exports) module.exports = logger
  else root.log = logger
})(typeof global !== 'undefined' ? global : window || this)
