#!/usr/bin/env node

/**
 * System dependencies.
 */

var fs = require('fs')
  , path = require('path')
  , exec = require('child_process').exec;

/**
 * Dependencies.
 */

var jade = require('jade')
  , yaml = require('yaml')
  , markdown = require('markdown').markdown;

/** 
 * Shortcuts.
 */

var basename = path.basename
  , dirname = path.dirname
  , extname = path.extname
  , join = path.join
  , normalize = path.normalize
  , exists = path.existsSync
  , stat = fs.statSync
  , read = fs.readFileSync
  , write = fs.writeFileSync
  , readdir = fs.readdirSync;

/**
 * Version.
 */

var version = '0.0.5';

/**
 * Directory structure.
 */

var structure = { 
    site: 'site'
  , content: 'content'
  , layouts: 'layouts'
  , public: 'public'
  , config: 'config.yaml'
  , defaultLayout:  'layout' };

/**
 * Help.
 */

var usage = [''
  , '  Usage:'
  , '    nozzle g                 generate the site'
  , '    nozzle s                 start the server'
  , ''
  , '  Options:'
  , '    -v, --version            output framework version'
  , '    -h, --help               output help information'
  , ''].join('\n');

/**
 * Parse arguments.
 */

var arg = process.argv.slice(2).shift();
switch (arg) {
  case 'g':
  case 'generate':
    generate();
    break;
  case 's':
  case 'server':
    server(3000);
    break;
  case '-h':
  case '--help':
    abort(usage);
    break;
  case '-v':
  case '--version':
    abort(version);
    break;
}

/**
 * Generate the site.
 */

function generate() {

  //get global vars
  var config = getConfig();

  refresh(function() {
    //site variable availabe in all pages
    var site = config.site || {};

    var pages = getPages();

    //group pages by collection
    pages.forEach(function(page) { groupPages(page, site); });

    //render and save the page 
    pages.forEach(function(page) { save(render(page, site)); });

    copyPublicFiles(); 
  });
}

/**
 * Recreate `structure.site` directory.
 */

function refresh(fn) {
  if (!exists(structure.site)) mkdir(structure.site, fn);
  rmdir(structure.site, function() {
    mkdir(structure.site, fn);
  });  
}

/**
 * Recreate `structure.site` directory.
 */

function copyPublicFiles() {
  if(!exists(structure.public)) return;
  var files = readdir(structure.public);
  if (!files.length) return;
  cp(structure.public + '/*', structure.site);
}

/**
 * Go and read the `structure.config` file.
 */

function getConfig() {
  if (!exists(structure.config)) return {};
  return yaml.eval(read(structure.config, 'utf8'));
}

/**
 * Save the page.
 */

function save(page) {
  mkdir(structure.site + '/' + dirname(page.dest), function() {
    write(structure.site + '/' + page.dest, page.content);
  });
}

/**
 * Colect pages by collection and expose the collection as a site var.
 */

function groupPages(page, site) {
  var locals = page.locals, collection = locals.page.collection;
  if (!collection) return;
  if (!(collection in site)) site[collection] = [];
  site[collection].push(locals.page);
  return page;
}

/**
 * Get pages.
 */

function getPages(fn) {
  var pages = [];

  if (!exists(structure.content)) return pages;

  (function _get(path, fn) {
    readdir(path).forEach(function(file) {
      file = join(path, file);
      var fd = stat(file), page;

      if (fd.isDirectory()) {
        _get(file, fn); 
      } else if (fd.isFile()) {
        page = createPage(file);
        pages.push(page);
      }
    });
  })(structure.content, fn);

  //order pages by date 
  return pages.sort(function(a, b) {
    return b.locals.page.date - a.locals.page.date;
  });
}

/**
 * Create the page and metadata from a `file`.
 */

function createPage(file) {
  //format of the file
  var format = extname(file);

  //title of the file 
  var title = basename(file, format);

  //date of the file
  var date = stat(file).mtime;

  //the actual content of the file
  var content = read(file, 'utf8');

  // all the dirs from the file path
  var dirs = dirname(file).split('/');

  // destination path
  var destDirname = dirs.slice(1).join('/')
    , destBasename = title != 'index' ? title + '/index.html' : title + '.html'
    , dest = join(destDirname, destBasename);

  var url = normalize('/' + dirname(dest));

  var collection;
  //get the collection (the 2nd directory i.e. Content/[collection])
  if (dirs.length>1) collection = dirs[1];

  //cut header for content if exists
  var parts = getHeaderAndContent(content)
    , header = parts.header
    , content = parts.content;

  var layout = existentLayout(collection) || existentLayout(structure.defaultLayout);

  var page = { 
      locals: {}
    , content: content
    , layout: layout
    , format: format
    , dest: dest
    , src: file };

  page.locals.page = {
      title: title
    , date: date
    , url: url
    , collection: collection };

  //get page header vars
  page.headerLayout = header.layout;
  delete header.layout;
  apply(page.locals.page, header);

  return page;
}

/**
 * Split header from content.
 */

function getHeaderAndContent(content) {
  var header = {}, sep = '---', parts;
  var hasHeader = !content.indexOf(sep);

  if (hasHeader) {
    parts = content.split(sep);
    parts.shift(); 
    header = yaml.eval(parts.shift());
    content = parts.join(sep);
  }
  return {header: header, content: content};
}

/**
 * Render the layout.
 */

function render(page, site) {
  var locals = page.locals, layoutPath, parts, header;

  if (!page.isLayout) {
    locals.site = site;
  } else {
    page.format = '.jade';
    //expose the content as a var in page
    locals.content = page.content;
    layoutPath = join(structure.layouts, page.layout + '.jade');
    //read the content of the layout
    page.content =  read(layoutPath, 'utf8');
    //cut the header for content and get layout's layout if any
    parts = getHeaderAndContent(page.content);
    header = parts.header;
    page.content = parts.content;
    page.headerLayout = header.layout;
    page.layout = structure.defaultLayout;

    //finally, no more layouts to render
    if (page.done) page.layout = null;
  } 

  if (page.format == '.md') { 
    page.content = markdown.toHTML(page.content); 
  } else if (page.format == '.jade') { 
    page.content = jade.render(page.content, {locals: apply({}, page.locals)});
  }

  if (page.headerLayout === false) page.layout = null;
  else page.layout = page.headerLayout || page.layout;

  if (page.layout) {
    page.isLayout = true;
    page.done = page.layout == structure.defaultLayout;
    render(page, site); 
  } 

  return page;
}

/**
 * Check if a layout file exists.
 */

function existentLayout(layout) {
  if (exists(join(structure.layouts, layout + '.jade'))) return layout; 
}

/**
 * Start the server.
 */

function server(port) {
  //todo: check out if _site exist
  //console.log("Can't find _site directory. Run 'nozzle gen' to generate it.");
  var static = require('node-static');
  var file = new(static.Server)(structure.site);

  require('http').createServer(function (req, res) {
    req.addListener('end', function () {
      file.serve(req, res);
    });
  }).listen(port);
  console.log('Serving files at http://localhost:' + port);
}

/**
 * HELPERS.
 */

/** 
 * Mkdir -p.
 */

function mkdir(path, fn) { 
  system('mkdir -p ' + path, fn); 
}

/** Rm -rf.
 *
 */

function rmdir(path, fn) { 
  system('rm -rf ' + path, fn); 
}

/** 
 * Cp -rf source target.
 */

function cp(source, target, fn) { 
  system('cp -rf ' + source + ' ' + target, fn); 
}

/**
 * Execute system commands.
 */

function system(command, fn) {
  exec(command, function(err) {
    if (err) throw err;
    fn && fn();
  });
}

/**
 * Exit with the given `str`.
 */

function abort(str) {
  console.error(str);
  process.exit(1);
}

/**
 * Copies properties from one object to another.
 */

function apply(destination, source) {
  destination = destination || {};
  source = source || {};
  for (var i in source) if (source.hasOwnProperty(i)) destination[i] = source[i];
  return destination;
}
