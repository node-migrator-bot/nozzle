# Nozzle

Nozzle is a simple static site generator build on node. It takes a bunch of Markdown files or Jade templates put them in a base Jade template and generates HTML files.

## Install

    $ npm install nozzle -g

## Command Line Interface

    $ nozzle g      Generates the site.
    $ nozzle s      Start the internal server to see your site.

## Directory structure

* content - Files that will end up as pages.
* layouts - Files that are used as base templates for content. 
* public - Static files like css, js or images.
* config.yaml - Configuration file.

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
