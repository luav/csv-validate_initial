const CsvParser = require('../index')
// const { Readable } = require('readable-stream')
const { PassThrough } = require('readable-stream')
// global.Buffer = global.Buffer || require('buffer').Buffer
const { once } = require('events')

;(function () {
  // Drag-and-Drop File Uploader With Progress Bar (Vanilla JavaScript)
  // https://www.smashingmagazine.com/2018/01/drag-drop-file-uploader-vanilla-js/

  const dropArea = document.getElementById('drop-area')
  // let filesDone = 0
  // let filesToDo = 0
  // let progressBar = document.getElementById('progress-bar')

  // Prevent default behaviors
  ;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false)
  })

  function preventDefaults (e) {
    e.preventDefault()
    e.stopPropagation()
  }

  // Highligh the dropping area
  ;['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false)
  })

  ;['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false)
  })

  function highlight (e) {
    dropArea.classList.add('highlight')
  }

  function unhighlight (e) {
    dropArea.classList.remove('highlight')
  }

  // Process the file dropping event
  dropArea.addEventListener('drop', handleDrop, false)

  function handleDrop (e) {
    const dt = e.dataTransfer
    // let files = dt.files
    // handleFiles(files)

    // Note: there are different interfaces exist for files processing: DataTransferItemList vs
    if (dt.items) {
      // dt.items.length
      for (const dti of dt.items) {
        // If dropped items aren't files, reject them
        if (dti.kind === 'file') { parseFile(dti.getAsFile()) }
      }
    } else {
      // Use DataTransfer interface to access the file(s)
      handleFiles(dt.files)
    }
  }

  // function previewFile(file) {
  //     let reader = new FileReader()
  //     reader.readAsDataURL(file)
  //     reader.onloadend = function() {
  //         let img = document.createElement('img')
  //         img.src = reader.result
  //         document.getElementById('gallery').appendChild(img)
  //     }
  // }

  // Reading csv file using JavaScript and HTML5: https://www.js-tutorials.com/javascript-tutorial/reading-csv-file-using-javascript-html5/
  // The Local files are opened with FileReader API, and remote files are downloaded with XMLHttpRequest
})()

async function handleFiles (files) {
  // files.length can be used to show the processing progress
  // ([...files]).forEach(parseFile); // files is not an array, but a FileList
  for (const file of files) {
    let errs = await parseFile(file, errs)
    if (errs.length) {
        const hdr = document.createElement('h2')
        hdr.textContent = 'Parsing Errors'
        document.getElementById('results').appendChild(par)
    }
    for (const err of errs) {
      const par = document.createElement('p')
      par.textContent = err
      document.getElementById('results').appendChild(par)
    }
  }
}

async function parseFile (file) {
  const sizeRemMB = file.size % (1024 * 1024)
  console.log(`Parsing ${file.size - sizeRemMB} MB and ${sizeRemMB} bytes: ${file.name}`)
  const freader = file.stream().getReader()
  const input = new PassThrough()
  const csvParser = CsvParser.import(input) // , { newLine: '\n' }
  csvParser
    //.on('data', (data) => {
    //  processed += data.length
    //  console.log(`Parsing progress: ${processed / file.size * 100} %`)
    //})
    .on('end', function () { console.log('Parser finished') })
    .on('error', function (err) { console.error(err) })

  // Form a parser input stream form the file
  let processed = 0 // The size of the processed part of the stream in bytes
  let result
  while (!(result = await freader.read()).done) {
    // Note: drain event listener causes
    // from-browser.js:2 Uncaught Error:  Readable.from is not available in the browser
    if (!input.write(result.value)) {
      // Handle backpressure
      await once(input, 'drain')
    }
    // input.write(result.value)
    processed += result.value.byteLength // value.length
    console.log(`Progress: ${processed / file.size * 100} %`)
  }

  // input.write('key1;key2;key3\n')
  console.log('parseFile() finished')

  // Note: File.prototype.size can be used for the progress tracing
  // const element = document.createElement('div');

  // // Lodash, currently included via a script, is required for this line to work
  // element.innerHTML = _.join(['Hello', 'webpack'], ' ');

  // return element;
}