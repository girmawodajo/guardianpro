/**
 * Android Binary XML (AXML) Encoder
 * Converts Android manifest definitions into compiled AXML (RES_XML_TYPE = 0x00080003).
 * Properly encodes boolean attributes (TYPE_INT_BOOLEAN = 0x12), integers (0x10), and strings (0x03).
 * Fixes Android PackageParser "There was a problem parsing the package" and "Package appears to be invalid".
 */

interface Attribute {
  ns?: string;
  name: string;
  value: string | number | boolean;
  type?: 'string' | 'int' | 'boolean';
  resourceId?: number;
}

interface XMLElement {
  name: string;
  attrs: Attribute[];
  children?: XMLElement[];
}

export function buildBinaryManifest(
  packageName: string,
  versionCode: number,
  versionName: string,
  appName: string,
  isCompanion: boolean
): Uint8Array {
  const strings: string[] = [];
  const stringMap = new Map<string, number>();

  function addString(s: string): number {
    if (stringMap.has(s)) {
      return stringMap.get(s)!;
    }
    const idx = strings.length;
    strings.push(s);
    stringMap.set(s, idx);
    return idx;
  }

  // Pre-seed namespace and common Android attribute names
  const ANDROID_NS = 'http://schemas.android.com/apk/res/android';
  addString(ANDROID_NS);
  addString('android');
  addString('package');
  addString('versionCode');
  addString('versionName');
  addString('minSdkVersion');
  addString('targetSdkVersion');
  addString('name');
  addString('label');
  addString('allowBackup');
  addString('exported');
  addString('action');
  addString('category');

  // Build element tree
  const root: XMLElement = {
    name: 'manifest',
    attrs: [
      { name: 'package', value: packageName },
      { ns: ANDROID_NS, name: 'versionCode', value: versionCode, type: 'int', resourceId: 0x0101021b },
      { ns: ANDROID_NS, name: 'versionName', value: versionName, type: 'string', resourceId: 0x0101021c },
    ],
    children: [
      {
        name: 'uses-sdk',
        attrs: [
          { ns: ANDROID_NS, name: 'minSdkVersion', value: 21, type: 'int', resourceId: 0x0101020c },
          { ns: ANDROID_NS, name: 'targetSdkVersion', value: 34, type: 'int', resourceId: 0x01010270 },
        ],
      },
      {
        name: 'uses-permission',
        attrs: [{ ns: ANDROID_NS, name: 'name', value: 'android.permission.INTERNET', resourceId: 0x01010003 }],
      },
      {
        name: 'uses-permission',
        attrs: [{ ns: ANDROID_NS, name: 'name', value: 'android.permission.ACCESS_FINE_LOCATION', resourceId: 0x01010003 }],
      },
      {
        name: 'uses-permission',
        attrs: [{ ns: ANDROID_NS, name: 'name', value: 'android.permission.ACCESS_NETWORK_STATE', resourceId: 0x01010003 }],
      },
      {
        name: 'application',
        attrs: [
          { ns: ANDROID_NS, name: 'label', value: appName, type: 'string', resourceId: 0x01010001 },
          { ns: ANDROID_NS, name: 'allowBackup', value: false, type: 'boolean', resourceId: 0x01010280 },
        ],
        children: [
          {
            name: 'activity',
            attrs: [
              { ns: ANDROID_NS, name: 'name', value: `${packageName}.MainActivity`, type: 'string', resourceId: 0x01010003 },
              { ns: ANDROID_NS, name: 'exported', value: true, type: 'boolean', resourceId: 0x01010010 },
            ],
            children: [
              {
                name: 'intent-filter',
                attrs: [],
                children: [
                  {
                    name: 'action',
                    attrs: [{ ns: ANDROID_NS, name: 'name', value: 'android.intent.action.MAIN', type: 'string', resourceId: 0x01010003 }],
                  },
                  {
                    name: 'category',
                    attrs: [{ ns: ANDROID_NS, name: 'name', value: 'android.intent.category.LAUNCHER', type: 'string', resourceId: 0x01010003 }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  // Traverse tree to index all strings and resource IDs
  const resourceIds: number[] = [];
  function indexElement(elem: XMLElement) {
    addString(elem.name);
    for (const attr of elem.attrs) {
      if (attr.ns) addString(attr.ns);
      const nameIdx = addString(attr.name);
      if (attr.resourceId !== undefined) {
        resourceIds[nameIdx] = attr.resourceId;
      }
      if (typeof attr.value === 'string') {
        addString(attr.value);
      }
    }
    if (elem.children) {
      for (const child of elem.children) {
        indexElement(child);
      }
    }
  }
  indexElement(root);

  for (let i = 0; i < strings.length; i++) {
    if (resourceIds[i] === undefined) {
      resourceIds[i] = 0;
    }
  }

  // 1. Build String Pool Chunk (UTF-16LE)
  const stringOffsets: number[] = [];
  const stringDataBytes: number[] = [];

  for (let i = 0; i < strings.length; i++) {
    stringOffsets.push(stringDataBytes.length);
    const str = strings[i];
    const len = str.length;
    stringDataBytes.push(len & 0xff, (len >> 8) & 0xff);
    for (let c = 0; c < str.length; c++) {
      const code = str.charCodeAt(c);
      stringDataBytes.push(code & 0xff, (code >> 8) & 0xff);
    }
    stringDataBytes.push(0, 0);
  }

  while (stringDataBytes.length % 4 !== 0) {
    stringDataBytes.push(0);
  }

  const stringPoolHeaderSize = 28;
  const stringsStart = stringPoolHeaderSize + strings.length * 4;
  const stringPoolTotalSize = stringsStart + stringDataBytes.length;

  const stringPoolBuf: number[] = [];
  writeUInt16LE(stringPoolBuf, 0x0001); // RES_STRING_POOL_TYPE
  writeUInt16LE(stringPoolBuf, stringPoolHeaderSize);
  writeUInt32LE(stringPoolBuf, stringPoolTotalSize);
  writeUInt32LE(stringPoolBuf, strings.length);
  writeUInt32LE(stringPoolBuf, 0); // styleCount
  writeUInt32LE(stringPoolBuf, 0); // flags (UTF-16)
  writeUInt32LE(stringPoolBuf, stringsStart);
  writeUInt32LE(stringPoolBuf, 0); // stylesStart

  for (const offset of stringOffsets) {
    writeUInt32LE(stringPoolBuf, offset);
  }
  stringPoolBuf.push(...stringDataBytes);

  // 2. Build Resource Map Chunk
  const resMapTotalSize = 8 + resourceIds.length * 4;
  const resMapBuf: number[] = [];
  writeUInt16LE(resMapBuf, 0x0180); // RES_XML_RESOURCE_MAP_TYPE
  writeUInt16LE(resMapBuf, 8);
  writeUInt32LE(resMapBuf, resMapTotalSize);
  for (const rid of resourceIds) {
    writeUInt32LE(resMapBuf, rid);
  }

  // 3. Build XML Node Tree
  const xmlNodesBuf: number[] = [];
  let lineNumber = 1;

  const nsPrefixIdx = stringMap.get('android')!;
  const nsUriIdx = stringMap.get(ANDROID_NS)!;

  writeUInt16LE(xmlNodesBuf, 0x0100); // RES_XML_START_NAMESPACE_TYPE
  writeUInt16LE(xmlNodesBuf, 16);
  writeUInt32LE(xmlNodesBuf, 24);
  writeUInt32LE(xmlNodesBuf, lineNumber++);
  writeUInt32LE(xmlNodesBuf, 0xffffffff);
  writeUInt32LE(xmlNodesBuf, nsPrefixIdx);
  writeUInt32LE(xmlNodesBuf, nsUriIdx);

  function serializeElement(elem: XMLElement) {
    const nameIdx = stringMap.get(elem.name)!;
    const attrCount = elem.attrs.length;
    const startElemSize = 16 + 20 + attrCount * 20;

    writeUInt16LE(xmlNodesBuf, 0x0102); // RES_XML_START_ELEMENT_TYPE
    writeUInt16LE(xmlNodesBuf, 16);
    writeUInt32LE(xmlNodesBuf, startElemSize);
    writeUInt32LE(xmlNodesBuf, lineNumber++);
    writeUInt32LE(xmlNodesBuf, 0xffffffff);

    writeUInt32LE(xmlNodesBuf, 0xffffffff); // ns
    writeUInt32LE(xmlNodesBuf, nameIdx); // name
    writeUInt16LE(xmlNodesBuf, 20); // attributeStart
    writeUInt16LE(xmlNodesBuf, 20); // attributeSize
    writeUInt16LE(xmlNodesBuf, attrCount);
    writeUInt16LE(xmlNodesBuf, 0);
    writeUInt16LE(xmlNodesBuf, 0);
    writeUInt16LE(xmlNodesBuf, 0);

    for (const attr of elem.attrs) {
      const aNsIdx = attr.ns ? stringMap.get(attr.ns)! : 0xffffffff;
      const aNameIdx = stringMap.get(attr.name)!;

      if (attr.type === 'boolean') {
        const boolVal = attr.value === true || attr.value === 1 || attr.value === 'true';
        writeUInt32LE(xmlNodesBuf, aNsIdx);
        writeUInt32LE(xmlNodesBuf, aNameIdx);
        writeUInt32LE(xmlNodesBuf, 0xffffffff); // rawValue
        writeUInt16LE(xmlNodesBuf, 8); // size = 8
        xmlNodesBuf.push(0); // res0
        xmlNodesBuf.push(0x12); // dataType = TYPE_INT_BOOLEAN (18)
        writeUInt32LE(xmlNodesBuf, boolVal ? 0xffffffff : 0); // data
      } else if (attr.type === 'int') {
        const intVal = Number(attr.value);
        writeUInt32LE(xmlNodesBuf, aNsIdx);
        writeUInt32LE(xmlNodesBuf, aNameIdx);
        writeUInt32LE(xmlNodesBuf, 0xffffffff); // rawValue
        writeUInt16LE(xmlNodesBuf, 8); // size = 8
        xmlNodesBuf.push(0); // res0
        xmlNodesBuf.push(0x10); // dataType = TYPE_INT_DEC (16)
        writeUInt32LE(xmlNodesBuf, intVal); // data
      } else {
        const valStr = String(attr.value);
        const valIdx = stringMap.get(valStr)!;
        writeUInt32LE(xmlNodesBuf, aNsIdx);
        writeUInt32LE(xmlNodesBuf, aNameIdx);
        writeUInt32LE(xmlNodesBuf, valIdx); // rawValue
        writeUInt16LE(xmlNodesBuf, 8); // size = 8
        xmlNodesBuf.push(0); // res0
        xmlNodesBuf.push(0x03); // dataType = TYPE_STRING (3)
        writeUInt32LE(xmlNodesBuf, valIdx); // data
      }
    }

    if (elem.children) {
      for (const child of elem.children) {
        serializeElement(child);
      }
    }

    writeUInt16LE(xmlNodesBuf, 0x0103); // RES_XML_END_ELEMENT_TYPE
    writeUInt16LE(xmlNodesBuf, 16);
    writeUInt32LE(xmlNodesBuf, 24);
    writeUInt32LE(xmlNodesBuf, lineNumber++);
    writeUInt32LE(xmlNodesBuf, 0xffffffff);
    writeUInt32LE(xmlNodesBuf, 0xffffffff);
    writeUInt32LE(xmlNodesBuf, nameIdx);
  }

  serializeElement(root);

  writeUInt16LE(xmlNodesBuf, 0x0101); // RES_XML_END_NAMESPACE_TYPE
  writeUInt16LE(xmlNodesBuf, 16);
  writeUInt32LE(xmlNodesBuf, 24);
  writeUInt32LE(xmlNodesBuf, lineNumber++);
  writeUInt32LE(xmlNodesBuf, 0xffffffff);
  writeUInt32LE(xmlNodesBuf, nsPrefixIdx);
  writeUInt32LE(xmlNodesBuf, nsUriIdx);

  const totalFileSize = 8 + stringPoolBuf.length + resMapBuf.length + xmlNodesBuf.length;
  const result: number[] = [];

  writeUInt16LE(result, 0x0003); // RES_XML_TYPE
  writeUInt16LE(result, 8);
  writeUInt32LE(result, totalFileSize);

  result.push(...stringPoolBuf);
  result.push(...resMapBuf);
  result.push(...xmlNodesBuf);

  return new Uint8Array(result);
}

function writeUInt16LE(buf: number[], val: number) {
  buf.push(val & 0xff, (val >> 8) & 0xff);
}

function writeUInt32LE(buf: number[], val: number) {
  buf.push(val & 0xff, (val >> 8) & 0xff, (val >> 16) & 0xff, (val >> 24) & 0xff);
}
