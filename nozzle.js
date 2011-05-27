#!/usr/bin/env node

//system dependencies
var fs = require('fs'),
  path = require('path'),
  exec = require('child_process').exec;

//dependencies
var jade = require('jade'),
  yaml = require('yaml'),
  markdown = require('markdown').markdown;

//shortcuts
var basename = path.basename,
  dirname = path.dirname,
  extname = path.extname,
  join = path.join,
  normalize = path.normalize,
  exists = path.existsSync,
  stat = fs.statSync,
  read = fs.readFileSync,
  write = fs.writeFileSync,
  readdir = fs.readdirSync;

//version
var version = '0.0.4';

// root dir structure
var SITE = 'site',
  CONTENT = 'content',
  LAYOUTS = 'layouts',
  PUBLIC = 'public',
  CONFIG = 'config.yaml',
  DEFAULT_LAYOUT = 'layout';

//help
var usage = ['',
  '  Usage:',
  '    nozzle g                 generate the site',
  '    nozzle s                 start the server',
  '',
  '  Options:',
  '    -v, --version            output framework version',
  '    -h, --help               output help information',
  ''
].join('\n');


// parse arguments
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

//generate the site
function generate() {

  //get global vars
  var config = getConfig();

  refresh(function() {
    //site variable availabe in all pages
    var site = config.site || {};

    //get the pages from FS and collect them in collections
    var pages = getPages(function(page) { groupPages(page, site); });

    //render and save the page 
    pages.forEach(function(page) { save(render(page, site)); });

    copyPublicFiles(); 
  });
}

function refresh(fn) {
  if (!exists(SITE)) mkdir(SITE, fn);
  rmdir(SITE, function() {
    mkdir(SITE, fn);
  });  
}

function copyPublicFiles() {
  if(!exists(PUBLIC)) return;
  var files = readdir(PUBLIC);
  if (!files.length) return;
  cp(PUBLIC + '/*', SITE);
}

function getConfig() {
  if (!exists(CONFIG)) return {};
  return yaml.eval(read(CONFIG, 'utf8'));
}

function save(page) {
  mkdir(SITE + '/' + dirname(page.dest), function() {
    write(SITE + '/' + page.dest, page.content);
  });
}

//colect pages by collection and exposte the collection as a site var
function groupPages(page, site) {
  var locals = page.locals, collection = locals.page.collection;
  if (!collection) return;
  if (!(collection in site)) site[collection] = [];
  site[collection].push(locals.page);
  return page;
}

//gather pages from path
function getPages(fn) {
  var pages = [];

  if (!exists(CONTENT)) return pages;

  (function _get(path, fn) {
    readdir(path).forEach(function(file) {
      file = join(path, file);
      var fd = stat(file), page;

      if (fd.isDirectory()) {
        _get(file, fn); 
      } else if (fd.isFile()) {
        page = createPage(file);
        pages.push(page);
        fn && fn(page);
      }
    });
  })(CONTENT, fn);

  return pages;
}


function createPage(file) {
  //format of the file
  var format = extname(file);

  //title of the file 
  var title = basename(file, format);

  //the actual content of the file
  var content = read(file, 'utf8');

  // all the dirs from the file path
  var dirs = dirname(file).split('/');

  // destination path
  var destDirname = dirs.slice(1).join('/');
  var destBasename = title != 'index' ? title + '/index.html' : title + '.html';
  var dest = join(destDirname, destBasename);

  var url = normalize('/' + dirname(dest));

  var collection;
  //get the collection (the 2nd directory i.e. CONTENT/[collection])
  if (dirs.length>1) collection = dirs[1];

  //cut header for content if exists
  var parts = getHeaderAndContent(content); 
  header = parts.header;
  content = parts.content;

  var layout = existentLayout(collection) || existentLayout(DEFAULT_LAYOUT);

  var page = { 
    locals: {},
    content: content,
    layout: layout,
    format: format,
    dest: dest,
    src: file
  };

  page.locals.page = {
    title: title,
    url: url,
    collection: collection
  };

  //get page header vars
  page.headerLayout = header.layout;
  delete header.layout;
  apply(page.locals.page, header);

  return page;
}


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


function render(page, site) {
  var locals = page.locals, layoutPath, parts, header;

  if (!page.isLayout) {
    locals.site = site;
  } else {
    page.format = '.jade';
    //expose the content as a var in page
    locals.content = page.content;
    layoutPath = join(LAYOUTS, page.layout + '.jade');
    //read the content of the layout
    page.content =  read(layoutPath, 'utf8');
    //cut the header for content and get layout's layout if any
    parts = getHeaderAndContent(page.content);
    header = parts.header;
    page.content = parts.content;
    page.headerLayout = header.layout;
    page.layout = DEFAULT_LAYOUT;

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
    page.done = page.layout == DEFAULT_LAYOUT;
    render(page, site); 
  } 

  return page;
}

function existentLayout(layout) {
  if (exists(join(LAYOUTS, layout + '.jade'))) return layout; 
}

//start the server
function server(port) {
  //todo: check out if _site exist
  //console.log("Can't find _site directory. Run 'nozzle gen' to generate it.");
  var static = require('node-static');
  var file = new(static.Server)(SITE);

  require('http').createServer(function (req, res) {
    req.addListener('end', function () {
      file.serve(req, res);
    });
  }).listen(port);
  console.log('Serving files at http://localhost:' + port);
}

// helpers

// mkdir -p.
function mkdir(path, fn) { 
  system('mkdir -p ' + path, fn); 
}

// rm -rf.
function rmdir(path, fn) { 
  system('rm -rf ' + path, fn); 
}

// cp -rf source target.
function cp(source, target, fn) { 
  system('cp -rf ' + source + ' ' + target, fn); 
}

// execute system commands
function system(command, fn) {
  exec(command, function(err) {
    if (err) throw err;
    fn && fn();
  });
}

// exit with the given `str`.
function abort(str) {
  console.error(str);
  process.exit(1);
}

// copies properties from one object to another
function apply(destination, source) {
  destination = destination || {};
  source = source || {};
  for (var i in source) if (source.hasOwnProperty(i)) destination[i] = source[i];
  return destination;
}