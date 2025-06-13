const allPropertyNames = [
  'id',
  'width',
  'height',
  'currentPage',
  'cancel',
  'origin',
  'onmessage',
  'center',
  'zoom',
  'fontName',
  'name',
  'visible',
  'locked',
  'constraints',
  'relativeTransform',
  'x',
  'y',
  'rotation',
  'constrainProportions',
  'layoutAlign',
  'layoutGrow',
  'opacity',
  'blendMode',
  'isMask',
  'effects',
  'effectStyleId',
  'expanded',
  'backgrounds',
  'backgroundStyleId',
  'fills',
  'strokes',
  'strokeWeight',
  'strokeMiterLimit',
  'strokeAlign',
  'strokeCap',
  'strokeJoin',
  'dashPattern',
  'fillStyleId',
  'strokeStyleId',
  'cornerRadius',
  'cornerSmoothing',
  'topLeftRadius',
  'topRightRadius',
  'bottomLeftRadius',
  'bottomRightRadius',
  'exportSettings',
  'overflowDirection',
  'numberOfFixedChildren',
  'description',
  'layoutMode',
  'primaryAxisSizingMode',
  'counterAxisSizingMode',
  'primaryAxisAlignItems',
  'counterAxisAlignItems',
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'paddingBottom',
  'itemSpacing',
  'layoutGrids',
  'gridStyleId',
  'clipsContent',
  'guides',
  'guides',
  'selection',
  'selectedTextRange',
  'backgrounds',
  'arcData',
  'pointCount',
  'pointCount',
  'innerRadius',
  'vectorNetwork',
  'vectorPaths',
  'handleMirroring',
  'textAlignHorizontal',
  'textAlignVertical',
  'textAutoResize',
  'paragraphIndent',
  'paragraphSpacing',
  'autoRename',
  'textStyleId',
  'fontSize',
  'fontName',
  'textCase',
  'textDecoration',
  'letterSpacing',
  'lineHeight',
  'characters',
  'mainComponent',
  'scaleFactor',
  'booleanOperation',
  'expanded',
  'name',
  'type',
  'paints',
  'type',
  'fontSize',
  'textDecoration',
  'fontName',
  'letterSpacing',
  'lineHeight',
  'paragraphIndent',
  'paragraphSpacing',
  'textCase',
  'type',
  'effects',
  'type',
  'layoutGrids',
];

type AnyStringMap = { [key: string]: any };

export function assign(a: BaseNode & AnyStringMap, b: AnyStringMap) {
  for (const key in b) {
    const value = b[key];
    if (key === 'data' && value && typeof value === 'object') {
      const currentData =
        JSON.parse(a.getSharedPluginData('builder', 'data') || '{}') || {};
      const newData = value;
      const mergedData = Object.assign({}, currentData, newData);
      // TODO merge plugin data
      a.setSharedPluginData('builder', 'data', JSON.stringify(mergedData));
    } else if (
      typeof value != 'undefined' &&
      ['width', 'height', 'type', 'ref', 'children', 'svg'].indexOf(key) === -1
    ) {
      try {
        a[key] = b[key];
      } catch (err) {
        console.warn(`Assign error for property "${key}"`, a, b, err);
      }
    }
  }
}
