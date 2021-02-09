/**
 * This program is to index the contents of the helpdesk and generate a json file
 * that has all of the files and a path for each of them
 */

const fs = require('fs')
const path = require('path')

const CDN = ''
const REPO_LOCATION = path.join(__dirname, '..')
const OUT = path.join(REPO_LOCATION, 'CDN')
const BLACKLIST = ['scripts']

let index = []

// Logging functions. These are to allow for greater flexibility in the logging
const println = (text) => process.stdout.write(`${text}`)
const eraseLast = () => process.stdout.write('\r\x1b[K')

// File system helper functions
const listDir = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)

const listFiles = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((dirent) => dirent.isFile())
    .map((dirent) => dirent.name)

// Note that this indexer expects the following file structure (currently)
// Product -> os -> help pages (no subfolder allowed)

println('Indexing products...')
console.time('Indexing products')

const products = listDir(REPO_LOCATION)
  .filter((dir) => dir.charAt(0) !== '.')
  .filter((dir) => !BLACKLIST.includes(dir))

eraseLast()
console.timeEnd('Indexing products')

println('Parsing products...')
console.time('Parsing products')

products.forEach((product) => {
  const productData = {
    subfolderStructure: 'os',
    name: product,
    entries: [],
  }

  listDir(path.join(REPO_LOCATION, product)).forEach((os) => {
    const files = listFiles(path.join(REPO_LOCATION, product, os)).map(
      (file) => ({
        local: path.join(REPO_LOCATION, product, os, file),
        name: file,
        cdn: `https://${CDN}/${product}/${os}/${file}`,
      })
    )

    productData.entries.push({ key: os, files })
  })

  index.push(productData)
})

eraseLast()
console.timeEnd('Parsing products')

fs.mkdirSync(OUT)
index.forEach((product) => {
  fs.mkdirSync(path.join(OUT, product.name))

  product.entries.forEach((entry) => {
    fs.mkdirSync(path.join(OUT, product.name, entry.key))

    entry.files.forEach((file) => {
      fs.copyFileSync(
        file.local,
        path.join(OUT, product.name, entry.key, file.name)
      )
    })
  })
})

fs.writeFileSync(
  path.join(OUT, 'index.json'),
  JSON.stringify(
    index.map((product) => ({
      entries: product.entries.map((entry) => ({
        files: entry.files.map((file) => file.cdn),
        ...entry,
      })),
      ...product,
    }))
  )
)

println('Constructing CDN product...')
console.time('Constructing CDN product')

eraseLast()
console.timeEnd('Constructing CDN product')
