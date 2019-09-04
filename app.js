const fs = require('fs')
const args = require('args')
const PSD = require('psd')
const imagemin = require('imagemin')
const imageminPngquant = require('imagemin-pngquant')




function getOutPut (elementInfo, styleList, domHtml, groupList, fileName, ind, isBG) {
  if (elementInfo.type === 'layer') {
    domHtml += `<img class="swg-item swg-${groupList.join('-')} item-${ind} ${isBG ? 'bg' : ''}" width="${elementInfo.width}" height="${elementInfo.height}" src="./${fileName}.png" />\r\n    `
    return [styleList, domHtml]
  } else {
    domHtml += `<div class="swg-item swg-${groupList.join('-')} item-${ind}">`
    return [styleList, domHtml]
  }
}

// 缓存文件
function cacheFile (layerId, element, fileTemp, groupList, fileName) {
  if (fileTemp[layerId] === undefined) {
    fileTemp[layerId] = `${groupList.join('-')}`
    // 导出图片
    const imagePath = `./${fileName}/${groupList.join('-')}.png`
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
  } else {
    console.log(`图层 [${element.name}] 与文件 [${fileTemp[layerId]}] 重复,智能忽略!`)
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

function realOutPut (fileName, node, groupList) {
  const nodeParent = node.parent
  const childrenNodeList = node.children()
  // 文件缓存
  let fileTemp = {}
  const itemIndex = groupList.length > 0 ? parseInt(groupList[groupList.length - 1]) : 0
  // const parent = node

  // 初始化html存储字段
  let domHtml = ''

  // 根节点和子节点通用样式
  let styleList = [
    `z-index: ${-itemIndex}`
  ]

  // 初始化样式临时存储字段
  let styleData = ``
  if (node.isRoot()) {
    styleList.push(
      'position: relative',
      `width: ${node.psd.header.cols}px`,
      `height: ${node.psd.header.rows}px`,
    )
    styleData = `.swg-root {${styleList.join('; ')};}\r\n      `
    domHtml = `<div class="swg-root" width="${node.width}" height="${node.height}">`
  } else {
    // 如果不是根节点 会有上下左右位置
    styleList.push(
      'position: absolute',
      `left: ${node.left - nodeParent.left}px`,
      `top: ${node.top - nodeParent.top}px`,
      `right: ${nodeParent.right - node.right}px`,
      `bottom: ${nodeParent.bottom - node.bottom}px`,
      `width: ${node.width}px`,
      `height: ${node.height}px`,
    )
    styleData = `.swg-${groupList.join('-')} {${styleList.join('; ')};}\r\n      `
    domHtml = `<div class="swg-${groupList.join('-')} item-${itemIndex}">`
  }
  
  for (let ind in childrenNodeList) {
    const element = childrenNodeList[ind]
    const elementInfo = element.export()
    let groupListCopy = JSON.parse(JSON.stringify(groupList))
    groupListCopy.push(ind)
    // console.log(element)
    // if (element.name == '改革1') {
    //   console.log(element.type, element.text)
    //   console.log(element.export())
    // }
    
    // 跳过空图层
    if (isEmptyLayer(elementInfo)) continue

    // 判断是否为组
    if (element.type === 'group') {
      // 递归处理子节点
      // console.log(element.height, element.left)
      console.log(`递归处理组: ${element.name}`)
      const outPut = realOutPut(fileName, element, groupListCopy)
      // console.log(outPut)
      domHtml += outPut.html
      styleData += outPut.style
      continue
    }
    // console.log(element.name, elementInfo.left, element.parent.left)
    // console.log(`处理图层: ${element.name}`)

    // 从文件缓存中取出是否以前生成过此图层
    const layerId = getLayerID(element.layer)
    fileTemp = cacheFile(layerId, element, fileTemp, groupListCopy, fileName)

    const leftValue = elementInfo.left - element.parent.left
    const topValue = elementInfo.top - element.parent.top
    const rightValue = element.parent.right - elementInfo.right
    const bottomValue = element.parent.bottom - elementInfo.bottom
    let styleList = [
      'position: absolute',
      `left: ${leftValue}px`,
      `top: ${topValue}px`,
      `right: ${rightValue}px`,
      `bottom: ${bottomValue}px`,
      `opacity: ${elementInfo.opacity}`,
      `z-index: ${-ind}`
    ]
    const isBG = leftValue == 0  && topValue == 0 && rightValue == 0 && bottomValue == 0
    const outPutData = getOutPut(elementInfo, styleList, domHtml, groupListCopy, fileTemp[layerId], ind, isBG)
    styleList = outPutData[0]
    domHtml = outPutData[1]
    styleData += `.swg-${groupListCopy.join('-')} {${styleList.join('; ')};}\r\n      `
  }
  domHtml += `</div>`
  return {
    html: domHtml,
    style: styleData
  }
}


// 读取模板内容
let temple = fs.readFileSync('./page.temple', 'utf-8')

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

console.log(fs.existsSync(`./${fileName}`))
if (!fs.existsSync(`./${fileName}`)) {
  fs.mkdirSync(`./${fileName}`)
}



const treeLength = psd.tree().descendants().length
console.log(`图层个数: ${treeLength}`)
console.log(`图像宽度: ${psd.header.cols}, 图像高度: ${psd.header.rows}`)

const outPut = realOutPut(fileName, psd.tree(), [])

let domHtml = ``
let styleData = ``
// console.log(outPut)

let htmlTemple = temple
domHtml += outPut.html
styleData += outPut.style

htmlTemple = htmlTemple.replace(`<!-- page-output -->`, domHtml)
htmlTemple = htmlTemple.replace(`<!-- css-output -->`, styleData)
fs.writeFileSync(`./${fileName}/index.html`, htmlTemple)