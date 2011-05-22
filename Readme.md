# Nozzle

Nozzle is a simple static site generator build on [node](http://nodejs.org). It takes a bunch of [markdown](http://daringfireball.net/projects/markdown/basics) files or [jade](http://jade-lang.com) templates put them in a base Jade template and generates HTML files.

## Install

    $ npm install nozzle -g

## Command Line Interface

Run these commands inside your site.

    $ nozzle g      Generates the site.
    $ nozzle s      Start the internal server to see your site.

## Usage

!!!TBD

Create the site's basic structure.

    mkdir -p yoursite/{content,public,layouts}
    cd yoursite

### content

Inside `content` directory is where you can put markdown or jade templates. These files will end up as webpages.

You can also create directories as deep as you want, but take into account that the URLs are based on files's path. For example, if you have a file in `content/posts/for/blog/my-first-post.md`, the webpage's URL will be `http://yoursite.com/posts/for/blog/my-first-post`.

Inside markdown and jade templates you have access to `page`, `site` and possibly `content` variables. 

All of the directories from content directory will be available as collections in `site` variable. If you have a bunch of markdown files in `content/posts/` you can find them all in `site.posts`. Also, by default, the name of the file is the title of the web page, available as `page.title`. You also have `page.url` which points to the generated URL.

### layouts 

Files that are used as base templates for content. 

### public 

Static files like css, js or images.

### site 

Automatically generated site. No need to create it yourself.


## License

(The MIT License)

Copyright (c) 2011 Adrian Olaru

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the 'Software'), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
