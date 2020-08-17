function dataToHTML (infoData) {
  let designWidth = 1100
  let newHTML = ''
  let outStyle = ''
  let zoom = 1
  // 让像素单位都是5的倍数
  function integerNumber (number) {
    const temp = number % 5
    if (temp < (5 / 2)) {
      return number - temp
    } else {
      return number + (5 - temp)
    }
  }
  // 先找出最大的
  // infoData.forEach(element => {
  //   if (element.typename === "LayerSet") {
  //     if ((1200 / element.bounds.width) < zoom) zoom = 1200 / element.bounds.width
  //   }
  // });
  function handleGroup (groupInfo, isRoot, prefix) {
    
    let zIndex = 0
    for (let index = 0; index < groupInfo.length; index++) {
      const element = groupInfo[index];
      const width = integerNumber(element.bounds.width * zoom)
      const height = integerNumber(element.bounds.height * zoom)
      const left = integerNumber((element.bounds.relativeLeft != undefined ? element.bounds.relativeLeft : element.bounds.left) * zoom)
      const top = integerNumber((element.bounds.relativeTop != undefined ? element.bounds.relativeTop : element.bounds.top) * zoom)
      // 跳过手动指定的背景元素
      if (element.name.includes('o-bg')) {
        return
      }
      if (element.typename === "LayerSet") {
        if (isRoot) {
          const style = ``
          // 如果是页面第一条那么不需要上边距
          let clssStr = ``
          if (newHTML !== ``) {
            clssStr = `so-box so-${element.itemIndex}`
          } else {
            clssStr = `so-top so-${element.itemIndex}`
          }
          const marginTop = top - (groupInfo[index - 1] !== undefined ? groupInfo[index - 1].bounds.bottom : top)
          newHTML += `${prefix}<!-- ${element.name} ${marginTop} -->\n`
          newHTML += `${prefix}<div class="${clssStr}">\n`
          outStyle += `\n.so-${element.itemIndex} {\n  width: ${integerNumber(element.bounds.width * zoom)}px;\n  height: ${integerNumber(element.bounds.height * zoom)}px;`
          if (element.name.includes('o-fixed')) {
            outStyle += `\n  position: fixed;\n  z-index: 5;\n  left:${left}px;\n  top:${top}px;`
          }
        } else {
          const width = integerNumber(element.bounds.width * zoom)
          const height = integerNumber(element.bounds.height * zoom)
          const left = integerNumber((element.bounds.relativeLeft != undefined ? element.bounds.relativeLeft : element.bounds.left) * zoom)
          const top = integerNumber((element.bounds.relativeTop != undefined ? element.bounds.relativeTop : element.bounds.top) * zoom)
          let classStr = `so so-${element.itemIndex}`
          if (element.name.includes('o-')) {
            classStr += ` ${element.name}`
          }
          newHTML += `${prefix}<!-- ${element.name} -->\n`
          newHTML += `${prefix}<div class="${classStr}">\n`
          outStyle += `\n.so-${element.itemIndex} {\n  width: ${width}px;\n  height: ${height}px;\n  left: ${left}px;\n  top: ${top}px;`
        }
        if (element.children) {
          // 判断子集中是否有背景
          element.children.forEach(childItem => {
            if (childItem.name.includes('o-bg')) {
              outStyle += `\n  background-image: url("./${childItem.fileName}");`
            }
          });
          outStyle += `\n}`
          handleGroup(element.children, false, prefix + '  ')
        } else {
          outStyle += `\n}`
        }
        
        newHTML += `${prefix}</div>\n`
      } else {

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
          if (contentsListNoEmpty.length > 3) {
            newHTML += `${prefix}<ul class="so so-${element.itemIndex}">\n${prefix}  <li><a href="#">${contentsListNoEmpty.join('</a></li>\n' + prefix +'  <li><a href="#">')}</a></li>\n${prefix}</ul>\n`
            outStyle += `\n.so-${element.itemIndex} {\n  color: ${element.textItem.color};\n  line-height: ${parseInt(height / contentsListNoEmpty.length)}px;\n  font-size: ${element.textItem.size}px;\n  width: ${width}px;\n  height: ${height}px;\n  left: ${left}px;\n  top: ${top}px;\n}`
          } else {
            // 普通文字
            outStyle += `\n.so-${element.itemIndex} {\n  color: ${element.textItem.color};\n  font-size: ${element.textItem.size}px;\n  width: ${width}px;\n  left: ${left}px;\n  top: ${top}px;\n  z-index: ${zIndex};`
            // 判断是否多行
            if (element.bounds.height > (element.textItem.size * 1.8)) {
              newHTML += `${prefix}<p class="so-${element.itemIndex}">${contentsListNoEmpty.join('<br>')}</p>\n`
              outStyle += `\n  height: ${element.bounds.height}px;`
            } else {
              newHTML += `${prefix}<p class="so-${element.itemIndex}">${contentsListNoEmpty.join('<br>')}</p>\n`
              outStyle += `\n  line-height: ${element.bounds.height}px;`
            }
            // 判断是否是浮动元素
            if (element.name.includes('o-pos')) {
              outStyle += `\n  position: absolute;\n  left:${left}px;\n  top:${top}px;`
            }
            outStyle += `\n}`
          }
        } else {
          if (element.name.includes('o-pos')) {
            newHTML += `${prefix}<img src="./${element.fileName}" style="position: absolute;left:${left}px;top:${top}px;">\n`
          } else {
            newHTML += `${prefix}<img src="./${element.fileName}">\n`
          }
          
        }
      }
      zIndex--
    }
  }
  handleGroup(infoData, true, '  ')
  return [newHTML, outStyle]
}
