try {
  var loadSuccess = new ExternalObject("lib:\PlugPlugExternalObject"); //载入所需对象，loadSuccess 记录是否成功载入
} catch (e) {
  alert(e);// 如果载入失败，输出错误信息
}

var log = ''
var docWidth = 0
var docHeight = 0
var OutPath = null
var OutText = false
var ResPrefix = ''
var ResOutType = 'id'

function getPos (layer, parentInfo) {
  var obj = layer.bounds
  var returnData = {
    left: obj[0].as('px'),
    top: obj[1].as('px'),
    right: obj[2].as('px'),
    bottom: obj[3].as('px'),
    width: obj[2].as('px') - obj[0].as('px'),
    height: obj[3].as('px') - obj[1].as('px')
  }
  if (returnData.left < 0) {
    returnData.width += returnData.left
    returnData.left = 0
  }
  if (returnData.width > docWidth) {
    returnData.width = docWidth
  }
  // alert(returnData.width)
  if (returnData.top < 0) {
    returnData.height += returnData.top
    returnData.top = 0
  }
  if (returnData.height > docHeight) {
    returnData.height = docHeight
  }

  for (var key in returnData) {
    if (returnData[key] < 0) {
      returnData[key] = 0
    }
  }
  if (returnData.top == 0 && returnData.left == 0 && returnData.right == 0 && returnData.bottom == 0) {
    returnData.specialMode = true
  }
  if (parentInfo) {
    returnData.relativeLeft = returnData.left - parentInfo.bounds.left
    returnData.relativeTop = returnData.top - parentInfo.bounds.top
    returnData.relativeRight = parentInfo.bounds.right - returnData.right
    returnData.relativeBottom = parentInfo.bounds.bottom - returnData.bottom
    returnData.percentageLeft = Math.floor(returnData.relativeLeft / parentInfo.bounds.width * 10000) / 100
    returnData.percentageRight = Math.floor(returnData.relativeRight / parentInfo.bounds.width * 10000) / 100
    returnData.percentageTop = Math.floor(returnData.relativeTop / parentInfo.bounds.height * 10000) / 100
    returnData.percentageBottom = Math.floor(returnData.relativeBottom / parentInfo.bounds.height * 10000) / 100
    returnData.percentageHeight = Math.floor(returnData.height / parentInfo.bounds.height * 10000) / 100
    returnData.percentageWidth = Math.floor(returnData.width / parentInfo.bounds.width * 10000) / 100
  }
  
  return returnData
}

function getArtLayerType(kind) {
  switch (kind) {
    case LayerKind.NORMAL:
      return 'NORMAL'
      break;
    case LayerKind.TEXT:
      return 'TEXT'
      break;
    case LayerKind.SMARTOBJECT:
      return 'SMARTOBJECT'
      break;
    case LayerKind.SOLIDFILL:
      return 'SOLIDFILL'
      break;
    case LayerKind.VIDEO:
      return 'VIDEO'
      break;
    case LayerKind.LAYER3D:
      return 'LAYER3D'
      break;
    default:
      return 'OTHER'
  }
}

function getTextCase(kind) {
  switch (kind) {
    case TextCase.NORMAL:
      return 'NORMAL'
      break;
    case TextCase.ALLCAPS:
      return 'ALLCAPS'
      break;
    case TextCase.SMALLCAPS:
      return 'SMALLCAPS'
      break;
  }
}

// 向前端发送命令
function sendMessage (type, data) {
  if (loadSuccess) { 
    var eventJAX = new CSXSEvent(); //创建事件对象
    eventJAX.type = type; //设定一个类型名称
    eventJAX.data = data; // 事件要传递的信息
    eventJAX.dispatch(); // GO ! 发送事件
  }
}

var Quality = 80
var Png8 = false

function getTree (outPath, outText, resOutType, resPrefix, quality, png8, outPutRange) {
  Quality = quality
  Png8 = png8
  OutPath = outPath
  ResPrefix = resPrefix || ''
  OutText = outText
  ResOutType = resOutType || 'id'
  log = ''
  docWidth = app.activeDocument.width.as('px')
  docHeight = app.activeDocument.height.as('px')
  // 判断是输出全部还是输出选中组
  
  var parentInfo = null

  
  switch (outPutRange) {
    case 'all': {
      
      var layer = app.activeDocument
      var returnData = JSON.stringify(getLayers(layer.layers, parentInfo))
      
      if (log) alert(log)
      return JSON.stringify({
        err: 0,
        docWidth: docWidth,
        docHeight: docHeight,
        data: returnData
      })
      break
    }
    case 'select': {
      var layer = app.activeDocument.activeLayer
      if (layer.typename === 'LayerSet') {
        var layerInfo = getLayerInfo(layer)
        layerInfo.children = getLayers(layer.layers, layerInfo)
        return JSON.stringify({
          err: 0,
          docWidth: docWidth,
          docHeight: docHeight,
          data: JSON.stringify([layerInfo])
        })
      } else {
        var layerInfo = getLayerInfo(layer)
        return JSON.stringify({
          err: 0,
          docWidth: docWidth,
          docHeight: docHeight,
          data: JSON.stringify([outPutLayer(layerInfo, layer)])
        })
      }
      break
    }
  }
}

// 将图层新建为文档
function dupLayers(layerName) {
  var desc143 = new ActionDescriptor();
  var ref73 = new ActionReference();
  ref73.putClass( charIDToTypeID('Dcmn') );
  desc143.putReference( charIDToTypeID('null'), ref73 );
  desc143.putString( charIDToTypeID('Nm  '), layerName );
  var ref74 = new ActionReference();
  
  ref74.putEnumerated( charIDToTypeID('Lyr '), charIDToTypeID('Ordn'), charIDToTypeID('Trgt') );
  desc143.putReference( charIDToTypeID('Usng'), ref74 );
  try {
    executeAction(charIDToTypeID('Mk  '), desc143, DialogModes.NO );
    return true
  } catch (err) {
    alert(err)
    return false
  }
}

// 输出PNG图片
function SavePNG(saveFile, specialMode) {
  pngSaveOptions = new ExportOptionsSaveForWeb();
  pngSaveOptions.format = specialMode ? SaveDocumentType.JPEG : SaveDocumentType.PNG;
  // JPEG优化
  pngSaveOptions.optimized = true
  // 透明度
  pngSaveOptions.transparency = true
  pngSaveOptions.PNG8 = Boolean(Png8);
  // alert(pngSaveOptions.PNG8)
  pngSaveOptions.quality = Quality
  if (!specialMode) activeDocument.trim(TrimType.TRANSPARENT, true, true, true, true);
  // alert(activeDocument.height.as('px'))
  activeDocument.exportDocument(saveFile, ExportType.SAVEFORWEB, pngSaveOptions);
  // 返回图片的宽高
  return [activeDocument.width.as('px'), activeDocument.height.as('px')]
}


function getLayerInfo (layer, parentInfo) {
  var layerWidth = layer.bounds[2].as('px') - layer.bounds[0].as('px')
  var layerHeight = layer.bounds[3].as('px') - layer.bounds[1].as('px')
  // 背景超出部分剪裁
  if (layerWidth > docWidth) layerWidth = docWidth
  if (layerHeight > docHeight) layerHeight = docHeight
  // alert(layerHeight)
  
  // 排除掉空图层
  if (layerWidth == 0 && layerHeight == 0) {
    // alert(layer.name)
    log += '\r\n图层: ' + layer.name + '为空，跳过输出!'
    return null
  }
  if (!layer.visible) {
    log += '\r\n图层: ' + layer.name + '不可见，跳过输出!'
    return null
  }
  var layerInfo = {
    id: layer.id,
    name: layer.name,
    itemIndex: layer.itemIndex,
    opacity: parseInt(layer.opacity),
    visible: layer.visible,
    bounds: getPos(layer, parentInfo),
    typename: layer.typename,
    width: layerWidth,
    height: layerHeight
  }
  if (parseInt(docWidth) == parseInt(layerWidth) && parseInt(layerHeight) == parseInt(docHeight)) {
    layerInfo.bounds.specialMode = true
  }
  return layerInfo
}

function outPutLayer (layerInfo, layer, parentInfo) {
  layerInfo.kind = getArtLayerType(layer.kind)
  layerInfo.isBackgroundLayer = layer.isBackgroundLayer
  
  // 对文字进行处理
  if (layerInfo.kind === 'TEXT' && OutText) {
    var textItem = layer.textItem
    
    layerInfo.textItem = {
      contents: textItem.contents,
      color: '#' + textItem.color.rgb.hexValue,
      size: textItem.size.as('px'),
      // leading: textItem.leading.as('px'),
      position: [parseInt(textItem.position[0].as('px')), parseInt(textItem.position[1].as('px'))],
      // 大写信息
      // capitalization: getTextCase(textItem.capitalization),
      // 文本取向
      direction: textItem.direction == Direction.HORIZONTAL ? 'HORIZONTAL' : 'VERTICAL',
      font: textItem.font,
      // 仿斜体
      // fauxItalic: textItem.fauxItalic,
      // 首行缩进
      // firstLineIndent: textItem.firstLineIndent.as('pt')
    }
    try {layerInfo.textItem.leading = textItem.leading.as('px')} catch (error) {}
  } else {
    var resName = layer.id
    
    // 判断资源输出文件名
    switch (ResOutType) {
      case 'group-name':
        if (parentInfo) {
          saveFile = parentInfo.name + '-' + resName
          break
        }
      case 'name':
        resName = layer.name
        break
    }
    layerInfo.fileName = ResPrefix + resName + (layerInfo.bounds.specialMode ? ".jpg" : ".png")
    activeDocument.activeLayer = layer;
    // 新建并保存图片
    // 图层锁定的情况下有可能没法复制
    layer.allLocked = false
    if (dupLayers(layer)) {
      var saveFile = File(OutPath + layerInfo.fileName);
    
      const fileInfo = SavePNG(saveFile, layerInfo.bounds.specialMode);
      layerInfo.bounds.fileWeight = fileInfo[0]
      layerInfo.bounds.fileHeight = fileInfo[1]
      app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
    }
  }
  return layerInfo
}

var getLayers = function (layers, parentInfo) {
  var returnData = []
  for (var index = 0; index < layers.length; index++) {
    var layer = layers[index];
    
    var layerInfo = getLayerInfo(layer, parentInfo)
    if (layerInfo === null) {continue}
    switch (layer.typename) {
      // 判断是否为组
      case 'LayerSet':
        layerInfo.children = getLayers(layer.layers, layerInfo)
        break;
      // 判断是否为图层
      case 'ArtLayer':
        layerInfo = outPutLayer(layerInfo, layer, parentInfo)
        break;  
      default:
        break;
    }
    
    returnData.push(layerInfo)
  }
  return returnData
}
