#!/usr/bin/env node

const fs = require('fs')
// const PSD = require('C:/Users/my/Documents/GitHub/psd.js/index.js')

const PSD = require('readpsd')

let infoData = {}

function getOutPut (elementInfo, styleList, domHtml, groupList, fileName, ind, isBG, task) {
  // console.log(groupList)
  let groupListValue = groupList.join('-')
  if (!groupListValue) groupListValue = 'root'
  
  if (elementInfo.type === 'layer') {
    if (!infoData[`so-${groupListValue}`]) {
      infoData[`so-${groupListValue}`] = {}
    }
    infoData[`so-${groupListValue}`].ind = ind
    infoData[`so-${groupListValue}`].info = elementInfo
    infoData[`so-${groupListValue}`].fileName = `${task}-${fileName}.png`
    // 判断是否为文本
    if (elementInfo.text == undefined) {
      // 取出是否包含标签信息
      const tagTest = elementInfo.name.match(/\[-(\S*)-\]/)
      const tag = tagTest ? tagTest[1] : 'img'
      infoData[`so-${groupListValue}`].tag = tag
      switch (tag) {
        // 记录下来
        case 'img': {
          domHtml += `<img class="soulless so-${groupListValue} item-${ind} ${isBG ? 'bg' : ''}" width="${elementInfo.width}" height="${elementInfo.height}" src="./${task}-${fileName}.png" />\r\n    `
          break
        }
        case 'input': {
          domHtml += `<input type="text" class="soulless so-${groupListValue} item-${ind} ${isBG ? 'bg' : ''}" style="width:${elementInfo.width}px; height:${elementInfo.height}px; background-image: url(./${task}-${fileName}.png)"/>\r\n    `
          break
        }
      }
    } else {
      const textInfo = elementInfo.text
      const text = textInfo.value.replace(/\r/g, '<br>')
      domHtml += `<p class="soulless so-${groupListValue} so-text item-${groupList[groupList.length - 1]}">${text}</p>`
    }
    return [styleList, domHtml]
  } else {
    domHtml += `<div class="soulless so-${groupListValue} item-${ind}">`
    return [styleList, domHtml]
  }
}


// 缓存文件
function cacheFile (layerId, element, fileTemp, groupList, fileName) {
  const groupListValue = groupList.join('-')
  fileTemp[layerId] = `${groupListValue}`
  // 导出图片
  const imagePath = `./${fileName}/${fileName}-${groupList.join('-')}.png`
  if (element.layer.image && element.type === 'layer') {
    // console.log(`保存图片: ${imagePath}`)
    element.layer.image.saveAsPng(imagePath).then((e) => {
      // 压缩图片
      // imagemin([imagePath], `./${fileName}/`, {
      //   plugins: [
      //     imageminPngquant({
      //       quality: [0.6, 0.8]
      //     })
      //   ]
      // })
    })
  } else {
    console.log(`没有图层: ${imagePath}`)
  }
  return fileTemp
}

// 过滤空图层和隐藏图层
function isEmptyLayer (elementInfo) {
  if (elementInfo.visible == false) {
    console.log(`有不可见图层: ${elementInfo.name}`)
    return true
  }
  // 判断是否为空图层
  if (elementInfo.height === 0 || elementInfo.width === 0) {
    console.log(`图层为空: ${elementInfo.name}`)
    return true
  }
}

function getLayerID (layer) {
  return "" + layer.image.obj.numPixels + layer.image.obj.length + layer.image.obj.opacity
}

function handleGroup (fileName, node, groupList, itemIndex) {
  const nodeParent = node.parent
  let groupStyle = [
    'position: absolute',
    `left: ${node.left - (nodeParent ? nodeParent.left : 0)}px`,
    `top: ${node.top - (nodeParent ? nodeParent.top: 0)}px`,
    `width: ${node.width}px`,
    `height: ${node.height}px`,
    `z-index: ${itemIndex}`
  ]
  // console.log(groupList)
  const groupStr = groupList.length > 0 ? groupList.join('-') : 'root'
  let domHtml = `<div class="so-${groupStr} item-${itemIndex}" group="${groupStr}">`
  let styleData = `.so-${groupStr} {${groupStyle.join('; ')};}\r\n      `
  // 递归处理子节点
  console.log(`---------------------------------------`)
  console.log(`处理分组: ${node.name}`)
  const childrenList =  node.children()
  for (const ind in childrenList) {
    if (childrenList.hasOwnProperty(ind)) {
      const childrenNode = childrenList[ind];
      let groupListCopy = JSON.parse(JSON.stringify(groupList))
      groupListCopy.push(childrenList.length - ind)
      // console.log(childrenNode)
      const outPut = realOutPut(fileName, childrenNode, groupListCopy)
      // console.log(outPut.style + '\r\n')
      domHtml += outPut.html
      styleData += outPut.style   
    }
  }
  return {
    html: domHtml + '</div>',
    style: styleData
  }
}

function realOutPut (fileName, node, groupList) {
  // 文件缓存
  let fileTemp = {}
  
  const itemIndex = groupList.length > 0 ? parseInt(groupList[groupList.length - 1]) : 0
  // console.log(itemIndex)
  // const parent = node

  // 初始化html存储字段
  let domHtml = ''

  // 初始化样式临时存储字段
  let styleData = ``
  const elementInfo = node.export()
  // 跳过空图层
  if (isEmptyLayer(elementInfo)) {
    return {
      html: domHtml,
      style: styleData
    }
  }
  // 判断是否为组
  if (node.type === 'group' || node.isRoot()) {
    const outPut = handleGroup(fileName, node, groupList, itemIndex)
    domHtml += outPut.html
    styleData += outPut.style
    return {
      html: domHtml,
      style: styleData
    }
  }
  // 如果不是组则处理单个图层
  console.log(`—— 处理图层: ${node.name}`)
  // 从文件缓存中取出是否以前生成过此图层
  const layerId = getLayerID(node.layer)
  if (elementInfo.text === undefined) {
    fileTemp = cacheFile(layerId, node, fileTemp, groupList, fileName)
  }
  

  const leftValue = elementInfo.left - node.parent.left
  const topValue = elementInfo.top - node.parent.top
  const rightValue = node.parent.right - elementInfo.right
  const bottomValue = node.parent.bottom - elementInfo.bottom
  let styleList = [
    'position: absolute',
    `left: ${leftValue}px`,
    `z-index: ${itemIndex}`
  ]
  if (elementInfo.text !== undefined) {
    // 有问题待修复
    const textInfo = elementInfo.text
    const color = textInfo.font.colors[0]
    const fontSize = Math.floor(textInfo.font.sizes[0] - 1)
    const lineHeight = Math.floor(textInfo.font.leading[0])
    // console.log(textInfo.font)
    styleList.push(
      `font-family: '${textInfo.font.names.join("', '")}'`,
      `font-size: ${fontSize}px`,
      `line-height: ${lineHeight}px`,
      `color: rgba(${color[0]}, ${color[1]}, ${color[2]}, ${(color[3] / 255).toFixed(2)})`,
      `top: ${Math.ceil(topValue - fontSize) + 'px'}`
    )
    // 如果是一行文字则取消宽度限制
    if (elementInfo.height > lineHeight) {
      styleList.push(`width: ${elementInfo.width}px`)
    }
    if (textInfo.font.tracking[0]) {
      styleList.push(`letter-spacing: ${textInfo.font.tracking[0] / 1000 + 'em'}`)
    }
    // 由于ps显示逻辑和CSS不一致 所以要对top值进行处理
    // styleList['top'] = parseInt(elementInfo.top - parent.top - textInfo.font.sizes[0]) + '0px'
    // 判断是否有文字对齐方式
    if (textInfo.font.alignment[0] && textInfo.font.alignment[0] !== 'left') {
      styleList.push(`text-align: ${textInfo.font.alignment[0]}`)
    }
    if (textInfo.font.weights[0] && textInfo.font.weights[0] === 'bold') {
      styleList.push(`font-weight: bold`)
    }
  } else {
    styleList.push(`top: ${topValue}px`)
  }
  // 如果图层有透明度则还要读取出透明度
  if (elementInfo.opacity !== 1) {
    styleList.push(`opacity: ${elementInfo.opacity}`)
  }
  const isBG = leftValue == 0  && topValue == 0 && rightValue == 0 && bottomValue == 0
  const outPutData = getOutPut(elementInfo, styleList, domHtml, groupList, fileTemp[layerId], itemIndex, isBG, fileName)
  styleList = outPutData[0]
  domHtml = outPutData[1]
  styleData += `.so-${groupList.join('-')} {${styleList.join('; ')};}\r\n      `
  // 记录下来
  if (!infoData[`so-${groupList.join('-')}`]) {
    infoData[`so-${groupList.join('-')}`] = {}
  }
  infoData[`so-${groupList.join('-')}`].groupList = groupList
  infoData[`so-${groupList.join('-')}`].styleList = styleList
  
  // console.log(domHtml)
  // console.log('---------------------------------------')
  return {
    html: domHtml,
    style: styleData
  }
}


// 读取模板内容
let temple = fs.readFileSync(__dirname + '\\page.html', 'utf-8')

// console.log(process.argv)
let fileName = 'dist'
if (!process.argv[2]) {
  console.error('没有指定psd文件!')
  return
}

let psdFile = process.argv[2]
// psdFile = psdFile.replace('.\\', './')
// console.log(psdFile)
// 读取psd
const psd = PSD.fromFile(psdFile)
psd.parse()

if (!process.argv[3]) {
  console.error('没有指定项目名称!')
} else {
  fileName = process.argv[3]
}

// 删除文件夹
function deleteFolderRecursive(path) {
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file) {
      var curPath = path + "/" + file;
      if(fs.statSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

// console.log(fs.existsSync(`./${fileName}`))
if (fs.existsSync(`./${fileName}`)) {
  deleteFolderRecursive(`./${fileName}`)
}

fs.mkdirSync(`./${fileName}`)



const treeLength = psd.tree().descendants().length
console.log(`图层个数: ${treeLength}`)
console.log(`图像宽度: ${psd.header.cols}, 图像高度: ${psd.header.rows}`)

const outPut = realOutPut(fileName, psd.tree(), [])

let domHtml = ``
let styleData = ``

let htmlTemple = temple
domHtml += outPut.html + `</div>`
styleData += outPut.style

htmlTemple = htmlTemple.replace(`<!-- page-output -->`, domHtml)
htmlTemple = htmlTemple.replace(`/* <!-- css-output --> */`, styleData)
htmlTemple = htmlTemple.replace(`// <!-- script-output -->`, `var infoData = ${JSON.stringify(infoData)}`)
fs.writeFileSync(`./${fileName}/index.html`, htmlTemple)