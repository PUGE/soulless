function dataToHTML (infoData) {
  let designWidth = 1100
  let newHTML = ''
  let outStyle = ''
  let zoom = 1
  function integerNumber (number) {
    const temp = number % 5
    if (temp < (5 / 2)) {
      return number - temp
    } else {
      return number + (5 - temp)
    }
  }
  // 先找出最大的
  infoData.forEach(element => {
    if (element.typename === "LayerSet") {
      if ((1200 / element.bounds.width) < zoom) zoom = 1200 / element.bounds.width
    }
  });
  function handleGroup (groupInfo, isRoot, prefix) {
    let zIndex = 0
    for (let index = 0; index < groupInfo.length; index++) {
      
      const element = groupInfo[index];
      if (element.typename === "LayerSet") {
        if (isRoot) {
          const style = ``
          newHTML += `${prefix}<div class="so-box so-${element.itemIndex}">\n`
          outStyle += `\n.so-${element.itemIndex} {\n  width: ${integerNumber(element.bounds.width * zoom)}px;\n  height: ${integerNumber(element.bounds.height * zoom)}px;\n}`
        } else {
          const width = integerNumber(element.bounds.width * zoom)
          const height = integerNumber(element.bounds.height * zoom)
          const left = integerNumber((element.bounds.relativeLeft != undefined ? element.bounds.relativeLeft : element.bounds.left) * zoom)
          const top = integerNumber((element.bounds.relativeTop != undefined ? element.bounds.relativeTop : element.bounds.top) * zoom)
          newHTML += `${prefix}<div class="so so-${element.itemIndex}">\n`
          outStyle += `\n.so-${element.itemIndex} {\n  width: ${width}px;\n  height: ${height}px;\n  left: ${left}px;\n  top: ${top}px;\n}`
        }
        if (element.children) {
          handleGroup(element.children, false, prefix + '  ')
        }
        newHTML += `${prefix}</div>\n`
      } else {
        const width = integerNumber(element.bounds.width * zoom)
        const height = integerNumber(element.bounds.height * zoom)
        const left = integerNumber((element.bounds.relativeLeft != undefined ? element.bounds.relativeLeft : element.bounds.left) * zoom)
        const top = integerNumber((element.bounds.relativeTop != undefined ? element.bounds.relativeTop : element.bounds.top) * zoom)
        // 判断是否是题图
        // console.log(element)
        if (element.bounds.top < 2 && element.bounds.left < 2 && element.bounds.width > designWidth) {
          newHTML += `${prefix}<img style="width: 100%;height: auto;" src="./${element.fileName}">\n`
        } else if (element.kind === "TEXT" && element.textItem) {
          // 根据换行符分割段数
          let contentsList = element.textItem.contents.split('\r')
          let contentsListNoEmpty = []
          // 去掉空数组
          contentsList.forEach(element => {
            if (element && element != undefined && element != '') {
              contentsListNoEmpty.push(element)
            }
          });
          // 根据分割的段数判断是否是列表
          if (contentsListNoEmpty.length > 1) {
            newHTML += `${prefix}<ul class="so so-${element.itemIndex}">\n${prefix}  <li><a href="#">${contentsListNoEmpty.join('</a></li>\n' + prefix +'  <li><a href="#">')}</a></li>\n${prefix}</ul>\n`
            outStyle += `\n.so-${element.itemIndex} {\n  color: ${element.textItem.color};\n  line-height: ${parseInt(height / contentsListNoEmpty.length)}px;\n  position: absolute;\n  font-size: ${element.textItem.size}px;\n  width: ${width}px;\n  height: ${height}px;\n  left: ${left}px;\n  top: ${top}px;\n}`
          } else {
            // 普通文字
            console.log(element)
            // 判断是否多行
            if (element.bounds.height > (element.textItem.size * 1.8)) {
              newHTML += `${prefix}<p class="so-${element.itemIndex}">${contentsListNoEmpty.join('<br>')}</p>\n`
              outStyle += `\n.so-${element.itemIndex} {\n  color: ${element.textItem.color};\n  height: ${element.bounds.height}px;\n  position: absolute;\n  font-size: ${element.textItem.size}px;\n  width: ${width}px;\n  left: ${left}px;\n  top: ${top}px;\n  z-index: ${zIndex};\n}`
            } else {
              newHTML += `${prefix}<p class="so-${element.itemIndex}">${contentsListNoEmpty.join('<br>')}</p>\n`
              outStyle += `\n.so-${element.itemIndex} {\n  color: ${element.textItem.color};\n  line-height: ${element.bounds.height}px;\n  position: absolute;\n  font-size: ${element.bounds.height}px;\n  width: ${width}px;\n  left: ${left}px;\n  top: ${top}px;\n  z-index: ${zIndex};\n}`
            }
          }
        } else {
          newHTML += `${prefix}<img style="position: absolute;left: ${left}px;top: ${top}px;z-index: ${zIndex};" src="./${element.fileName}">\n`
        }
      }
      zIndex--
    }
  }
  handleGroup(infoData, true, '  ')
  return [newHTML, outStyle]
}
