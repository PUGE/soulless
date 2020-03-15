try {
  var loadSuccess = new ExternalObject("lib:\PlugPlugExternalObject"); //载入所需对象，loadSuccess 记录是否成功载入
} catch (e) {
  alert(e);// 如果载入失败，输出错误信息
}

var log = ''

function getPos (layer, parentInfo) {
  var obj = layer.bounds
  var returnData = {}
  if (parentInfo) {
    returnData = {
      relativeLeft: obj[0].as('px') - parentInfo.bounds.left,
      relativeTop: obj[1].as('px') - parentInfo.bounds.top,
      relativeRight: obj[2].as('px') - parentInfo.bounds.right,
      relativeBottom: obj[3].as('px') - parentInfo.bounds.bottom,
      left: obj[0].as('px'),
      top: obj[1].as('px'),
      right: obj[2].as('px'),
      bottom: obj[3].as('px'),
    }
  } else {
    returnData = {
      left: obj[0].as('px'),
      top: obj[1].as('px'),
      right: obj[2].as('px'),
      bottom: obj[3].as('px'),
    }
    // 判断是否为超出的背景
    if (returnData.left <= 0 || returnData.top <= 0) {
      if (returnData.left <= 0) {
        returnData.left = 0
      }
      if (returnData.top <= 0) {
        returnData.top = 0
      }
      // 剪裁标识
      returnData.specialMode = true
    }
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


function getTree (outPath, outText) {
  log = ''
  var layers = app.activeDocument.layers
  const returnData = JSON.stringify(getLayers(layers, outPath, '', outText))
  if (log) alert(log)
  return returnData
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
  executeAction( charIDToTypeID('Mk  '), desc143, DialogModes.NO );
}

// 输出PNG图片
function SavePNG(saveFile, specialMode) {
  pngSaveOptions = new PNGSaveOptions();
  pngSaveOptions.embedColorProfile = true;
  pngSaveOptions.formatOptions = FormatOptions.STANDARDBASELINE;
  pngSaveOptions.matte = MatteType.NONE;
  pngSaveOptions.PNG8 = false;
  pngSaveOptions.transparency = true;
  if (!specialMode) activeDocument.trim(TrimType.TRANSPARENT, true, true, true, true);
  activeDocument.saveAs(saveFile, pngSaveOptions, true, Extension.LOWERCASE);
}

var getLayers = function (layers, outPath, parentInfo, outText) {
  var returnData = []
  
  for (var index = 0; index < layers.length; index++) {
    var layer = layers[index];
    
    var layerWidth = layer.bounds[2].as('px') - layer.bounds[0].as('px')
    var layerHeight = layer.bounds[3].as('px') - layer.bounds[1].as('px')
    
    // 排除掉空图层
    if (layerWidth == 0 || layerHeight == 0) {
      // alert(layer.name)
      log += '\r\n图层: ' + layer.name + '为空，跳过输出!'
      continue
    }
    if (!layer.visible) {
      log += '\r\n图层: ' + layer.name + '不可见，跳过输出!'
      continue
    }
    var temp = {
      id: layer.id,
      name: parentInfo ? parentInfo.name + '-' + layer.name : layer.name,
      itemIndex: layer.itemIndex,
      opacity: parseInt(layer.opacity),
      visible: layer.visible,
      bounds: getPos(layer, parentInfo),
      typename: layer.typename,
      width: layerWidth,
      height: layerHeight
    }
    
    switch (layer.typename) {
      // 判断是否为组
      case 'LayerSet':
        temp.children = getLayers(layer.layers, outPath, temp, outText)
        break;
      // 判断是否为图层
      case 'ArtLayer':
        temp.kind = getArtLayerType(layer.kind)
        temp.isBackgroundLayer = layer.isBackgroundLayer
        
        // 对文字进行处理
        if (temp.kind === 'TEXT' && outText) {
          var textItem = layer.textItem
          
          temp.textItem = {
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
          try {temp.textItem.leading = textItem.leading.as('px')} catch (error) {}
        } else {
          activeDocument.activeLayer = layer;
          // alert(temp.name)
          dupLayers(layer);
          var saveFile = File(outPath + layer.name + ".png");
          if (parentInfo) {
            saveFile = File(outPath + parentInfo.name + '-' + layer.name + ".png");
          }
          
          SavePNG(saveFile, temp.bounds.specialMode);
          app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
        }
        
        break;  
      default:
        break;
    }
    returnData.push(temp)
    // 组处理
  }
  // var temp2 = ''
  // alert(LayerKind.TEXT)
  // for (var key in layers[0].kind) {
  //   alert(key)
  // }
  // if (loadSuccess) {
    // alert(JSON)
  //   var eventJAX = new CSXSEvent(); //创建事件对象
  //   eventJAX.type = "log"; //设定一个类型名称
  //   eventJAX.data = returnData
  //   eventJAX.dispatch(); // GO ! 发送事件
  // }
  return returnData
}
