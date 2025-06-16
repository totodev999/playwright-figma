var browserBundle = (function (exports) {
    'use strict';

    const context = {
      // @ts-expect-error
      window,
      document
    };
    const setContext$1 = (window2) => {
      context.document = window2.document;
      context.window = window2;
    };
    const replaceSvgFill = (svg, fillColor) => {
      const endTagIndex = svg.indexOf(">");
      const mainTag = svg.slice(1, endTagIndex);
      const fillAttr = `fill="${fillColor}"`;
      const mainTagWithFill = mainTag.includes("fill=") ? mainTag.replace(/fill\=(.*?)\s/, `fill="${fillColor}" `) : mainTag + fillAttr;
      return `<${mainTagWithFill}>${svg.slice(endTagIndex)}`;
    };

    const hasChildren = (node) => (
      // @ts-expect-error
      node && Array.isArray(node.children)
    );
    function traverse(layer, cb, parent = null) {
      if (layer) {
        cb(layer, parent);
        if (hasChildren(layer)) {
          layer.children.forEach(
            (child) => traverse(child, cb, layer)
          );
        }
      }
    }
    function traverseMap(layer, cb, parent = null) {
      if (layer) {
        const newLayer = cb(layer, parent);
        if (newLayer?.children?.length) {
          newLayer.children = newLayer.children.map(
            (child) => traverseMap(child, cb, layer)
          );
        }
        return newLayer;
      }
    }
    const capitalize = (str) => str[0].toUpperCase() + str.substring(1);
    function getRgb(colorString) {
      if (!colorString) {
        return null;
      }
      const [_1, r, g, b, _2, a] = colorString.match(
        /rgba?\(([\d\.]+), ([\d\.]+), ([\d\.]+)(, ([\d\.]+))?\)/
      ) || [];
      const none = a && parseFloat(a) === 0;
      if (r && g && b && !none) {
        return {
          r: parseInt(r) / 255,
          g: parseInt(g) / 255,
          b: parseInt(b) / 255,
          a: a ? parseFloat(a) : 1
        };
      }
      return null;
    }
    const fastClone = (data) => typeof data === "symbol" ? null : JSON.parse(JSON.stringify(data));
    const toNum = (v) => {
      if (!/px$/.test(v) && v !== "0") return 0;
      const n = parseFloat(v);
      return !isNaN(n) ? n : 0;
    };
    const toPercent = (v) => {
      if (!/%$/.test(v) && v !== "0") return 0;
      const n = parseInt(v);
      return !isNaN(n) ? n / 100 : 0;
    };
    const parseUnits = (str, relative) => {
      if (!str) {
        return null;
      }
      let value = toNum(str);
      if (relative && !value) {
        const percent = toPercent(str);
        if (!percent) return null;
        value = relative * percent;
      }
      if (value) {
        return {
          unit: "PIXELS",
          value
        };
      }
      return null;
    };
    const LENGTH_REG = /^[0-9]+[a-zA-Z%]+?$/;
    const isLength = (v) => v === "0" || LENGTH_REG.test(v);
    const parseMultipleCSSValues = (str) => {
      const parts = [];
      let lastSplitIndex = 0;
      let skobka = false;
      for (let i = 0; i < str.length; i++) {
        if (str[i] === "," && !skobka) {
          parts.push(str.slice(lastSplitIndex, i));
          lastSplitIndex = i + 1;
        } else if (str[i] === "(") {
          skobka = true;
        } else if (str[i] === ")") {
          skobka = false;
        }
      }
      parts.push(str.slice(lastSplitIndex));
      return parts.map((s) => s.trim());
    };
    const parseBoxShadowValue = (str) => {
      if (str.startsWith("rgb")) {
        const colorMatch = str.match(/(rgba?\(.+?\))(.+)/);
        if (colorMatch) {
          str = (colorMatch[2] + " " + colorMatch[1]).trim();
        }
      }
      const PARTS_REG = /\s(?![^(]*\))/;
      const parts = str.split(PARTS_REG);
      const inset = parts.includes("inset");
      const last = parts.slice(-1)[0];
      const color = !isLength(last) ? last : "rgba(0, 0, 0, 1)";
      const nums = parts.filter((n) => n !== "inset").filter((n) => n !== color).map(toNum);
      const [offsetX, offsetY, blurRadius, spreadRadius] = nums;
      const parsedColor = getRgb(color);
      if (!parsedColor) {
        console.error("Parse color error: " + color);
      }
      return {
        inset,
        offsetX,
        offsetY,
        blurRadius,
        spreadRadius,
        color: parsedColor || { r: 0, g: 0, b: 0, a: 1 }
      };
    };
    const getOpacity = (styles) => {
      return Number(styles.opacity);
    };
    const parseBoxShadowValues = (str) => {
      const values = parseMultipleCSSValues(str);
      return values.map((s) => parseBoxShadowValue(s));
    };
    const defaultPlaceholderColor = getRgb("rgba(178, 178, 178, 1)");

    function getBoundingClientRect(el, pseudo) {
      const { getComputedStyle } = context.window;
      const computed = getComputedStyle(el, pseudo);
      computed.display;
      if (pseudo) {
        return getBoundingClientRectPseudo(el, pseudo, computed);
      }
      return el.getBoundingClientRect();
    }
    function getBoundingClientRectPseudo(el, pseudo, style) {
      const copy = document.createElement("span");
      for (let i = 0, l = style.length; i < l; i++) {
        const prop = style[i];
        copy.style[prop] = style.getPropertyValue(prop) || style[prop];
      }
      pseudo === "after" ? el.append(copy) : el.prepend(copy);
      const rect = copy.getBoundingClientRect();
      el.removeChild(copy);
      return rect;
    }
    const getUrl = (url) => {
      if (!url) {
        return "";
      }
      let final = url.trim();
      if (final.startsWith("//")) {
        final = "https:" + final;
      }
      if (final.startsWith("/")) {
        final = "https://" + window.location.host + final;
      }
      return final;
    };
    const prepareUrl = (url) => {
      if (url.startsWith("data:")) {
        return url;
      }
      const urlParsed = new URL(url);
      return urlParsed.toString();
    };
    function isHidden(element, pseudo) {
      const { getComputedStyle } = context.window;
      let el = element;
      do {
        const computed = getComputedStyle(el, pseudo);
        if (computed.opacity === "0" || computed.display === "none" || computed.visibility === "hidden") {
          return true;
        }
        if (computed.overflow !== "visible" && el.getBoundingClientRect().height < 1) {
          return true;
        }
      } while (el = el.parentElement);
      return false;
    }
    var ElemTypes = /* @__PURE__ */ ((ElemTypes2) => {
      ElemTypes2[ElemTypes2["Textarea"] = 0] = "Textarea";
      ElemTypes2[ElemTypes2["Input"] = 1] = "Input";
      ElemTypes2[ElemTypes2["Image"] = 2] = "Image";
      ElemTypes2[ElemTypes2["Picture"] = 3] = "Picture";
      ElemTypes2[ElemTypes2["Video"] = 4] = "Video";
      ElemTypes2[ElemTypes2["SVG"] = 5] = "SVG";
      ElemTypes2[ElemTypes2["SubSVG"] = 6] = "SubSVG";
      ElemTypes2[ElemTypes2["Element"] = 7] = "Element";
      return ElemTypes2;
    })(ElemTypes || {});
    const getElemType = (el) => {
      if (el instanceof context.window.HTMLInputElement) {
        return 1 /* Input */;
      }
      if (el instanceof context.window.HTMLTextAreaElement) {
        return 0 /* Textarea */;
      }
      if (el instanceof context.window.HTMLPictureElement) {
        return 3 /* Picture */;
      }
      if (el instanceof context.window.HTMLImageElement) {
        return 2 /* Image */;
      }
      if (el instanceof context.window.HTMLVideoElement) {
        return 4 /* Video */;
      }
      if (el instanceof context.window.SVGSVGElement) {
        return 5 /* SVG */;
      }
      if (el instanceof context.window.SVGElement) {
        return 6 /* SubSVG */;
      }
      if (el instanceof context.window.HTMLElement) {
        return 7 /* Element */;
      }
    };
    const isElemType = (el, type) => {
      return getElemType(el) === type;
    };
    const getLineHeight = (el, computedStyles) => {
      const computedLineHeight = parseUnits(computedStyles.lineHeight);
      if (computedLineHeight) {
        return computedLineHeight;
      }
      if (isElemType(el, 1 /* Input */)) {
        return parseUnits(computedStyles.height);
      }
      const fontSize = parseUnits(computedStyles.fontSize)?.value;
      if (!fontSize) return null;
      return { value: Math.floor(fontSize * 1.2), unit: "PIXELS" };
    };

    const textToFigma = (node, { fromTextInput = false } = {}) => {
      const textValue = (node.textContent || node.value || node.placeholder)?.trim();
      if (!textValue) return;
      const { getComputedStyle } = context.window;
      const parent = node.parentElement;
      if (isHidden(parent)) {
        return;
      }
      const computedStyles = getComputedStyle(fromTextInput ? node : parent);
      const range = context.document.createRange();
      range.selectNode(node);
      const rect = fastClone(range.getBoundingClientRect());
      const lineHeight = getLineHeight(node, computedStyles);
      range.detach();
      if (lineHeight && lineHeight.value && rect.height < lineHeight.value) {
        const delta = lineHeight.value - rect.height;
        rect.top -= delta / 2;
        rect.height = lineHeight.value;
      }
      if (rect.height < 1 || rect.width < 1) {
        return;
      }
      let x = Math.round(rect.left);
      let y = Math.round(rect.top);
      let width = Math.round(rect.width);
      let height = Math.round(rect.height);
      if (fromTextInput) {
        const borderLeftWidth = parseUnits(computedStyles.borderLeftWidth)?.value || 0;
        const borderRightWidth = parseUnits(computedStyles.borderRightWidth)?.value || 0;
        const paddingLeft = parseUnits(computedStyles.paddingLeft)?.value || 0;
        const paddingRight = parseUnits(computedStyles.paddingRight)?.value || 0;
        const paddingTop = parseUnits(computedStyles.paddingTop)?.value || 0;
        const paddingBottom = parseUnits(computedStyles.paddingBottom)?.value || 0;
        x = x + borderLeftWidth + (fromTextInput ? paddingLeft : 0);
        y = y + paddingTop;
        width = width - borderRightWidth - paddingRight;
        height = height - paddingTop - paddingBottom;
      }
      const textNode = {
        x,
        y,
        width,
        height,
        ref: node,
        type: "TEXT",
        characters: textValue?.replace(/\s+/g, " ") || ""
      };
      const fills = [];
      let rgb = getRgb(computedStyles.color);
      const isPlaceholder = fromTextInput && !node.value && node.placeholder;
      rgb = isPlaceholder ? defaultPlaceholderColor : rgb;
      if (rgb) {
        fills.push({
          type: "SOLID",
          color: {
            r: rgb.r,
            g: rgb.g,
            b: rgb.b
          },
          blendMode: "NORMAL",
          visible: true,
          opacity: rgb.a || 1
        });
      }
      if (fills.length) {
        textNode.fills = fills;
      }
      const letterSpacing = parseUnits(computedStyles.letterSpacing);
      if (letterSpacing) {
        textNode.letterSpacing = letterSpacing;
      }
      if (lineHeight) {
        textNode.lineHeight = lineHeight;
      }
      const { textTransform } = computedStyles;
      switch (textTransform) {
        case "uppercase": {
          textNode.textCase = "UPPER";
          break;
        }
        case "lowercase": {
          textNode.textCase = "LOWER";
          break;
        }
        case "capitalize": {
          textNode.textCase = "TITLE";
          break;
        }
      }
      const fontSize = parseUnits(computedStyles.fontSize);
      if (fontSize) {
        textNode.fontSize = Math.round(fontSize.value);
      }
      if (computedStyles.fontFamily) {
        textNode.fontFamily = computedStyles.fontFamily;
      }
      if (computedStyles.textDecoration) {
        if (computedStyles.textDecoration === "underline" || computedStyles.textDecoration === "strikethrough") {
          textNode.textDecoration = computedStyles.textDecoration.toUpperCase();
        }
      }
      if (computedStyles.textAlign) {
        if (["left", "center", "right", "justified"].includes(
          computedStyles.textAlign
        )) {
          textNode.textAlignHorizontal = computedStyles.textAlign.toUpperCase();
        }
      }
      return textNode;
    };

    const getBorder = (computedStyle) => {
      if (!computedStyle.border) {
        return;
      }
      const parsed = computedStyle.border.match(/^([\d\.]+)px\s*(\w+)\s*(.*)$/);
      if (!parsed) return;
      let [_match, width, type, color] = parsed;
      if (width && width !== "0" && type !== "none" && color) {
        const rgb = getRgb(color);
        if (!rgb) return;
        return {
          strokes: [
            {
              type: "SOLID",
              color: {
                r: rgb.r,
                b: rgb.b,
                g: rgb.g
              },
              opacity: rgb.a || 1
            }
          ],
          strokeWeight: Math.round(parseFloat(width))
        };
      }
    };
    const getBorderPin = (rect, computedStyle) => {
      const directions = ["top", "left", "right", "bottom"];
      const layers = [];
      for (const dir of directions) {
        const computed = computedStyle["border" + capitalize(dir)];
        if (!computed) {
          continue;
        }
        const parsed = computed.match(/^([\d\.]+)px\s*(\w+)\s*(.*)$/);
        if (!parsed) continue;
        let [_match, borderWidth, type, color] = parsed;
        if (borderWidth && borderWidth !== "0" && type !== "none" && color) {
          const rgb = getRgb(color);
          if (rgb) {
            const width = ["top", "bottom"].includes(dir) ? rect.width : parseFloat(borderWidth);
            const height = ["left", "right"].includes(dir) ? rect.height : parseFloat(borderWidth);
            layers.push({
              type: "RECTANGLE",
              x: dir === "left" ? rect.left : dir === "right" ? rect.right - width : rect.left,
              y: dir === "top" ? rect.top - height : dir === "bottom" ? rect.bottom : rect.top,
              width,
              height,
              children: [],
              fills: [
                {
                  type: "SOLID",
                  color: {
                    r: rgb.r,
                    b: rgb.b,
                    g: rgb.g
                  },
                  opacity: rgb.a || 1
                }
              ]
            });
          }
        }
      }
      if (!layers.length) return;
      return [
        {
          type: "FRAME",
          clipsContent: false,
          name: "::borders",
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          children: layers,
          // @ts-expect-error
          fills: []
        }
      ];
    };

    function setData(node, key, value) {
      if (!node.data) {
        node.data = {};
      }
      node.data[key] = value;
    }
    const addConstraintToLayer = (layer, elem, pseudo) => {
      const { getComputedStyle, HTMLElement } = context.window;
      if (layer.type === "SVG") {
        layer.constraints = {
          horizontal: "CENTER",
          vertical: "MIN"
        };
        return;
      }
      if (!elem) {
        layer.constraints = {
          horizontal: "SCALE",
          vertical: "MIN"
        };
        return;
      }
      const el = elem instanceof HTMLElement ? elem : elem.parentElement;
      const parent = el && el.parentElement;
      if (!el || !parent) return;
      const currentDisplay = el.style.display;
      el.style.setProperty("display", "none", "!important");
      let computed = getComputedStyle(el, pseudo);
      const hasFixedWidth = computed.width && computed.width.trim().endsWith("px");
      const hasFixedHeight = computed.height && computed.height.trim().endsWith("px");
      el.style.display = currentDisplay;
      const parentStyle = getComputedStyle(parent);
      let hasAutoMarginLeft = computed.marginLeft === "auto";
      let hasAutoMarginRight = computed.marginRight === "auto";
      let hasAutoMarginTop = computed.marginTop === "auto";
      let hasAutoMarginBottom = computed.marginBottom === "auto";
      computed = getComputedStyle(el, pseudo);
      if (["absolute", "fixed"].includes(computed.position)) {
        setData(layer, "position", computed.position);
      }
      if (hasFixedHeight) {
        setData(layer, "heightType", "fixed");
      }
      if (hasFixedWidth) {
        setData(layer, "widthType", "fixed");
      }
      const isInline = computed.display && computed.display.includes("inline");
      if (isInline) {
        const parentTextAlign = parentStyle.textAlign;
        if (parentTextAlign === "center") {
          hasAutoMarginLeft = true;
          hasAutoMarginRight = true;
        } else if (parentTextAlign === "right") {
          hasAutoMarginLeft = true;
        }
        if (computed.verticalAlign === "middle") {
          hasAutoMarginTop = true;
          hasAutoMarginBottom = true;
        } else if (computed.verticalAlign === "bottom") {
          hasAutoMarginTop = true;
          hasAutoMarginBottom = false;
        }
        setData(layer, "widthType", "shrink");
      }
      const parentJustifyContent = parentStyle.display === "flex" && (parentStyle.flexDirection === "row" && parentStyle.justifyContent || parentStyle.flexDirection === "column" && parentStyle.alignItems);
      if (parentJustifyContent === "center") {
        hasAutoMarginLeft = true;
        hasAutoMarginRight = true;
      } else if (parentJustifyContent && (parentJustifyContent.includes("end") || parentJustifyContent.includes("right"))) {
        hasAutoMarginLeft = true;
        hasAutoMarginRight = false;
      }
      const parentAlignItems = parentStyle.display === "flex" && (parentStyle.flexDirection === "column" && parentStyle.justifyContent || parentStyle.flexDirection === "row" && parentStyle.alignItems);
      if (parentAlignItems === "center") {
        hasAutoMarginTop = true;
        hasAutoMarginBottom = true;
      } else if (parentAlignItems && (parentAlignItems.includes("end") || parentAlignItems.includes("bottom"))) {
        hasAutoMarginTop = true;
        hasAutoMarginBottom = false;
      }
      if (layer.type === "TEXT") {
        if (computed.textAlign === "center") {
          hasAutoMarginLeft = true;
          hasAutoMarginRight = true;
        } else if (computed.textAlign === "right") {
          hasAutoMarginLeft = true;
          hasAutoMarginRight = false;
        }
      }
      layer.constraints = {
        horizontal: hasAutoMarginLeft && hasAutoMarginRight ? "CENTER" : hasAutoMarginLeft ? "MAX" : "SCALE",
        vertical: hasAutoMarginBottom && hasAutoMarginTop ? "CENTER" : hasAutoMarginTop ? "MAX" : "MIN"
      };
    };

    const elementToFigma = (el, pseudo) => {
      if (el.nodeType === Node.TEXT_NODE) {
        return textToFigma(el);
      }
      if (el.nodeType !== Node.ELEMENT_NODE) {
        return;
      }
      if (el.nodeType !== Node.ELEMENT_NODE || isHidden(el, pseudo) || isElemType(el, ElemTypes.SubSVG)) {
        return;
      }
      const { getComputedStyle } = context.window;
      if (el.parentElement && isElemType(el, ElemTypes.Picture)) {
        return;
      }
      const computedStyle = getComputedStyle(el, pseudo);
      if (isElemType(el, ElemTypes.SVG)) {
        const rect2 = el.getBoundingClientRect();
        const fill = computedStyle.fill;
        return {
          type: "SVG",
          ref: el,
          // add FILL to SVG to get right color in figma
          svg: replaceSvgFill(el.outerHTML, fill),
          x: Math.round(rect2.left),
          y: Math.round(rect2.top),
          width: Math.round(rect2.width),
          height: Math.round(rect2.height)
        };
      }
      const rect = getBoundingClientRect(el, pseudo);
      if (rect.width < 1 || rect.height < 1) {
        return;
      }
      const fills = [];
      const color = getRgb(computedStyle.backgroundColor);
      if (color) {
        fills.push({
          type: "SOLID",
          color: {
            r: color.r,
            g: color.g,
            b: color.b
          },
          opacity: color.a || 1
        });
      }
      const overflowHidden = computedStyle.overflow !== "visible";
      const rectNode = {
        type: "FRAME",
        ref: el,
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        clipsContent: !!overflowHidden,
        fills,
        children: [],
        opacity: getOpacity(computedStyle)
      };
      const zIndex = Number(computedStyle.zIndex);
      if (isFinite(zIndex)) {
        rectNode.zIndex = zIndex;
      }
      const stroke = getBorder(computedStyle);
      if (stroke) {
        rectNode.strokes = stroke.strokes;
        rectNode.strokeWeight = stroke.strokeWeight;
      } else {
        rectNode.borders = getBorderPin(rect, computedStyle);
      }
      if (computedStyle.backgroundImage && computedStyle.backgroundImage !== "none") {
        const urlMatch = computedStyle.backgroundImage.match(
          /url\(['"]?(.*?)['"]?\)/
        );
        const url = urlMatch && urlMatch[1];
        if (url) {
          fills.push({
            url: prepareUrl(url),
            type: "IMAGE",
            // TODO: backround size, position
            scaleMode: computedStyle.backgroundSize === "contain" ? "FIT" : "FILL",
            imageHash: null
          });
        }
      }
      if (isElemType(el, ElemTypes.Image)) {
        const url = el.src;
        if (url) {
          fills.push({
            url,
            type: "IMAGE",
            // TODO: object fit, position
            scaleMode: computedStyle.objectFit === "contain" ? "FIT" : "FILL",
            imageHash: null
          });
        }
      }
      if (isElemType(el, ElemTypes.Picture)) {
        const firstSource = el.querySelector("source");
        if (firstSource) {
          const src = getUrl(firstSource.srcset.split(/[,\s]+/g)[0]);
          if (src) {
            fills.push({
              url: src,
              type: "IMAGE",
              // TODO: object fit, position
              scaleMode: computedStyle.objectFit === "contain" ? "FIT" : "FILL",
              imageHash: null
            });
          }
        }
      }
      if (isElemType(el, ElemTypes.Video)) {
        const url = el.poster;
        if (url) {
          fills.push({
            url,
            type: "IMAGE",
            // TODO: object fit, position
            scaleMode: computedStyle.objectFit === "contain" ? "FIT" : "FILL",
            imageHash: null
          });
        }
      }
      if (computedStyle.boxShadow && computedStyle.boxShadow !== "none") {
        const parsed = parseBoxShadowValues(computedStyle.boxShadow);
        const hasShadowSpread = parsed.findIndex(({ spreadRadius }) => Boolean(spreadRadius)) !== -1;
        if (hasShadowSpread) {
          rectNode.clipsContent = true;
        }
        rectNode.effects = parsed.map((shadow) => ({
          color: shadow.color,
          type: "DROP_SHADOW",
          radius: shadow.blurRadius,
          spread: shadow.spreadRadius,
          blendMode: "NORMAL",
          visible: true,
          offset: {
            x: shadow.offsetX,
            y: shadow.offsetY
          }
        }));
      }
      const borderTopLeftRadius = parseUnits(
        computedStyle.borderTopLeftRadius,
        rect.height
      );
      if (borderTopLeftRadius) {
        rectNode.topLeftRadius = borderTopLeftRadius.value;
      }
      const borderTopRightRadius = parseUnits(
        computedStyle.borderTopRightRadius,
        rect.height
      );
      if (borderTopRightRadius) {
        rectNode.topRightRadius = borderTopRightRadius.value;
      }
      const borderBottomRightRadius = parseUnits(
        computedStyle.borderBottomRightRadius,
        rect.height
      );
      if (borderBottomRightRadius) {
        rectNode.bottomRightRadius = borderBottomRightRadius.value;
      }
      const borderBottomLeftRadius = parseUnits(
        computedStyle.borderBottomLeftRadius,
        rect.height
      );
      if (borderBottomLeftRadius) {
        rectNode.bottomLeftRadius = borderBottomLeftRadius.value;
      }
      const result = rectNode;
      if (!pseudo && getComputedStyle(el, "before").content !== "none") {
        result.before = elementToFigma(el, "before");
        if (result.before) {
          addConstraintToLayer(result.before, el, "before");
          result.before.name = "::before";
        }
      }
      if (!pseudo && getComputedStyle(el, "after").content !== "none") {
        result.after = elementToFigma(el, "after");
        if (result.after) {
          addConstraintToLayer(result.after, el, "after");
          result.after.name = "::after";
        }
      }
      if (isElemType(el, ElemTypes.Input) || isElemType(el, ElemTypes.Textarea)) {
        result.textValue = textToFigma(el, { fromTextInput: true });
      }
      return result;
    };

    const removeMeta = (layerWithMeta) => {
      const { textValue, before, after, borders, ref, type, zIndex, ...rest } = layerWithMeta;
      if (!type) return;
      return { type, ...rest };
    };
    const mapDOM = (root) => {
      const elems = [];
      const walk = context.document.createTreeWalker(
        root,
        NodeFilter.SHOW_ALL,
        null
        // false
      );
      const refs = /* @__PURE__ */ new Map();
      let n = walk.currentNode;
      do {
        if (!n.parentElement) continue;
        const figmaEl = elementToFigma(n);
        if (figmaEl) {
          addConstraintToLayer(figmaEl, n);
          const children = refs.get(n.parentElement) || [];
          refs.set(n.parentElement, [...children, figmaEl]);
          elems.push(figmaEl);
        }
      } while (n = walk.nextNode());
      const result = elems[0];
      for (let i = 0; i < elems.length; i++) {
        const elem = elems[i];
        if (elem.type !== "FRAME") continue;
        elem.children = elem.children || [];
        elem.before && elem.children.push(elem.before);
        const children = refs.get(elem.ref) || [];
        children && elem.children.push(...children);
        if (!elem.textValue) {
          elem.children = elem.children.filter(Boolean);
        } else {
          elem.children = [elem.textValue];
        }
        if (elem.borders) {
          elem.children = elem.children.concat(elem.borders);
        }
        elem.after && elem.children.push(elem.after);
        elem.children.sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
      }
      const layersWithoutMeta = traverseMap(
        result,
        // @ts-expect-error
        (layer) => {
          return removeMeta(layer);
        }
      );
      traverse(layersWithoutMeta, (layer) => {
        if (layer.type === "FRAME" || layer.type === "GROUP") {
          const { x, y } = layer;
          if (x || y) {
            traverse(layer, (child) => {
              if (child === layer) {
                return;
              }
              child.x = child.x - x;
              child.y = child.y - y;
            });
          }
        }
      });
      return layersWithoutMeta;
    };
    function htmlToFigma$1(selector = "body") {
      const el = isElemType(selector, ElemTypes.Element) ? selector : context.document.querySelectorAll(selector || "body")[0];
      if (!el) {
        throw Error(`Element not found`);
      }
      for (const use of Array.from(el.querySelectorAll("use"))) {
        try {
          const symbolSelector = use.href.baseVal;
          const symbol = context.document.querySelector(symbolSelector);
          if (symbol) {
            use.outerHTML = symbol.innerHTML;
          }
        } catch (err) {
          console.warn("Error querying <use> tag href", err);
        }
      }
      const data = mapDOM(el);
      return data ? data : [];
    }

    function htmlToFigma() {
      const data = htmlToFigma$1();
      console.log("_htmlToFigma", htmlToFigma$1);
      return window.parent.postMessage({ type: "RESULT", data });
    }
    function setContext(win) {
      setContext$1(win);
    }
    (function() {
      window.htmlToFigma = htmlToFigma;
      window.setContext = setContext;
      try {
        htmlToFigma();
      } catch (e) {
        console.error("htmlToFigma\u306E\u81EA\u52D5\u5B9F\u884C\u30A8\u30E9\u30FC", e);
      }
    })();

    exports.htmlToFigma = htmlToFigma;
    exports.setContext = setContext;

    return exports;

})({});
