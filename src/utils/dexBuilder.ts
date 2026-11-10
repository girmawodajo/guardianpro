/**
 * Browser-side valid Dalvik Executable (classes.dex) Builder
 * Emits genuine Dalvik DEX 035 bytecode with a real MainActivity class definition,
 * valid string IDs, valid type table, constructor invoking Activity.<init>() via invoke-direct,
 * onCreate(Bundle) invoking Activity.onCreate(Bundle) via invoke-super,
 * valid code items, map list, Adler32, and SHA-1.
 * Resolves Android OS "Package appears to be invalid" / dexopt failures and lifecycle crashes.
 */

function adler32(buf: Uint8Array, start: number, end: number): number {
  let a = 1;
  let b = 0;
  for (let i = start; i < end; i++) {
    a = (a + buf[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

function writeUleb128(val: number): number[] {
  const res: number[] = [];
  let rem = val;
  do {
    let byte = rem & 0x7f;
    rem >>>= 7;
    if (rem !== 0) byte |= 0x80;
    res.push(byte);
  } while (rem !== 0);
  return res;
}

function writeUInt16LE(arr: Uint8Array, offset: number, val: number) {
  arr[offset] = val & 0xff;
  arr[offset + 1] = (val >> 8) & 0xff;
}

function writeUInt32LE(arr: Uint8Array, offset: number, val: number) {
  arr[offset] = val & 0xff;
  arr[offset + 1] = (val >> 8) & 0xff;
  arr[offset + 2] = (val >> 16) & 0xff;
  arr[offset + 3] = (val >> 24) & 0xff;
}

export async function buildValidDex(className = 'Lcom/guardianpath/child/companion/MainActivity;'): Promise<Uint8Array> {
  const strings = [
    '()V',
    '(Landroid/os/Bundle;)V',
    '<init>',
    'Landroid/app/Activity;',
    'Landroid/os/Bundle;',
    className,
    'Ljava/lang/Object;',
    'MainActivity.java',
    'V',
    'VL',
    'onCreate',
  ].sort();

  const stringDataOffsets: number[] = [];
  const stringDataBytes: number[] = [];
  let curDataOffset = 0;

  for (const s of strings) {
    stringDataOffsets.push(curDataOffset);
    const len = s.length;
    const uleb = writeUleb128(len);
    stringDataBytes.push(...uleb);
    for (let i = 0; i < s.length; i++) {
      stringDataBytes.push(s.charCodeAt(i));
    }
    stringDataBytes.push(0); // null terminator
    curDataOffset = stringDataBytes.length;
  }

  const numStrings = strings.length;
  const typeStrings = strings.filter((s) => s.startsWith('L') || s === 'V').sort();
  const numTypes = typeStrings.length;
  const typeMap = new Map<string, number>();
  typeStrings.forEach((ts, idx) => typeMap.set(ts, idx));

  const headerSize = 112;
  const stringIdsOff = headerSize;
  const stringIdsSize = numStrings;
  const typeIdsOff = stringIdsOff + stringIdsSize * 4;
  const typeIdsSize = numTypes;
  const protoIdsOff = typeIdsOff + typeIdsSize * 4;
  const protoIdsSize = 2; // Proto 0: ()V, Proto 1: (Bundle)V
  const fieldIdsOff = protoIdsOff + protoIdsSize * 12;
  const fieldIdsSize = 0;
  const methodIdsOff = fieldIdsOff;
  const methodIdsSize = 4; // 0: Activity.<init>, 1: Activity.onCreate, 2: MainActivity.<init>, 3: MainActivity.onCreate
  const classDefsOff = methodIdsOff + methodIdsSize * 8;
  const classDefsSize = 1;

  let dataOff = classDefsOff + classDefsSize * 32;
  while (dataOff % 4 !== 0) dataOff++;

  const absStringDataOff = dataOff;
  const stringIdsBuf = new Uint8Array(numStrings * 4);
  for (let i = 0; i < numStrings; i++) {
    writeUInt32LE(stringIdsBuf, i * 4, absStringDataOff + stringDataOffsets[i]);
  }

  const typeIdsBuf = new Uint8Array(numTypes * 4);
  for (let i = 0; i < numTypes; i++) {
    const sIdx = strings.indexOf(typeStrings[i]);
    writeUInt32LE(typeIdsBuf, i * 4, sIdx);
  }

  // type_list for Proto 1 parameters: [Landroid/os/Bundle;]
  let typeListOff = absStringDataOff + stringDataBytes.length;
  while (typeListOff % 4 !== 0) typeListOff++;
  const typeListBuf = new Uint8Array(8);
  writeUInt32LE(typeListBuf, 0, 1); // 1 parameter
  writeUInt16LE(typeListBuf, 4, typeMap.get('Landroid/os/Bundle;')!); // type index

  const protoIdsBuf = new Uint8Array(24);
  // Proto 0: ()V
  writeUInt32LE(protoIdsBuf, 0, strings.indexOf('V'));
  writeUInt32LE(protoIdsBuf, 4, typeMap.get('V')!);
  writeUInt32LE(protoIdsBuf, 8, 0);
  // Proto 1: (Landroid/os/Bundle;)V
  writeUInt32LE(protoIdsBuf, 12, strings.indexOf('VL'));
  writeUInt32LE(protoIdsBuf, 16, typeMap.get('V')!);
  writeUInt32LE(protoIdsBuf, 20, typeListOff);

  const methodIdsBuf = new Uint8Array(32);
  // Method 0: Landroid/app/Activity; -> <init>()V
  writeUInt16LE(methodIdsBuf, 0, typeMap.get('Landroid/app/Activity;')!);
  writeUInt16LE(methodIdsBuf, 2, 0);
  writeUInt32LE(methodIdsBuf, 4, strings.indexOf('<init>'));

  // Method 1: Landroid/app/Activity; -> onCreate(Bundle)V
  writeUInt16LE(methodIdsBuf, 8, typeMap.get('Landroid/app/Activity;')!);
  writeUInt16LE(methodIdsBuf, 10, 1);
  writeUInt32LE(methodIdsBuf, 12, strings.indexOf('onCreate'));

  // Method 2: className -> <init>()V
  writeUInt16LE(methodIdsBuf, 16, typeMap.get(className)!);
  writeUInt16LE(methodIdsBuf, 18, 0);
  writeUInt32LE(methodIdsBuf, 20, strings.indexOf('<init>'));

  // Method 3: className -> onCreate(Bundle)V
  writeUInt16LE(methodIdsBuf, 24, typeMap.get(className)!);
  writeUInt16LE(methodIdsBuf, 26, 1);
  writeUInt32LE(methodIdsBuf, 28, strings.indexOf('onCreate'));

  // Code item for MainActivity.<init>
  const codeInit = new Uint8Array(24);
  writeUInt16LE(codeInit, 0, 1); // registers = 1
  writeUInt16LE(codeInit, 2, 1); // ins = 1
  writeUInt16LE(codeInit, 4, 1); // outs = 1
  writeUInt16LE(codeInit, 6, 0); // tries = 0
  writeUInt32LE(codeInit, 8, 0); // debug = 0
  writeUInt32LE(codeInit, 12, 4); // insns_size = 4
  // invoke-direct {v0}, method@0
  codeInit[16] = 0x70;
  codeInit[17] = 0x10;
  codeInit[18] = 0x00;
  codeInit[19] = 0x00;
  codeInit[20] = 0x00;
  codeInit[21] = 0x00;
  // return-void
  codeInit[22] = 0x0e;
  codeInit[23] = 0x00;

  // Code item for MainActivity.onCreate(Bundle)
  const codeOnCreate = new Uint8Array(24);
  writeUInt16LE(codeOnCreate, 0, 2); // registers = 2 (v0=this, v1=bundle)
  writeUInt16LE(codeOnCreate, 2, 2); // ins = 2
  writeUInt16LE(codeOnCreate, 4, 2); // outs = 2
  writeUInt16LE(codeOnCreate, 6, 0); // tries = 0
  writeUInt32LE(codeOnCreate, 8, 0); // debug = 0
  writeUInt32LE(codeOnCreate, 12, 4); // insns_size = 4
  // invoke-super {v0, v1}, method@1
  codeOnCreate[16] = 0x6f;
  codeOnCreate[17] = 0x20;
  codeOnCreate[18] = 0x01;
  codeOnCreate[19] = 0x00;
  codeOnCreate[20] = 0x10;
  codeOnCreate[21] = 0x00;
  // return-void
  codeOnCreate[22] = 0x0e;
  codeOnCreate[23] = 0x00;

  let codeInitOff = typeListOff + typeListBuf.length;
  while (codeInitOff % 4 !== 0) codeInitOff++;

  let codeOnCreateOff = codeInitOff + codeInit.length;
  while (codeOnCreateOff % 4 !== 0) codeOnCreateOff++;

  // class_data_item:
  const classDataBytes: number[] = [
    ...writeUleb128(0), // static_fields_size
    ...writeUleb128(0), // instance_fields_size
    ...writeUleb128(1), // direct_methods_size
    ...writeUleb128(1), // virtual_methods_size
    ...writeUleb128(2), // method_idx_diff = 2 (MainActivity.<init>)
    ...writeUleb128(0x10001), // access_flags (ACC_PUBLIC | ACC_CONSTRUCTOR)
    ...writeUleb128(codeInitOff),
    ...writeUleb128(3), // method_idx_diff = 3 (MainActivity.onCreate)
    ...writeUleb128(0x0004), // access_flags (ACC_PROTECTED)
    ...writeUleb128(codeOnCreateOff),
  ];

  const classDataOff = codeOnCreateOff + codeOnCreate.length;

  const classDefBuf = new Uint8Array(32);
  writeUInt32LE(classDefBuf, 0, typeMap.get(className)!);
  writeUInt32LE(classDefBuf, 4, 0x0001); // ACC_PUBLIC
  writeUInt32LE(classDefBuf, 8, typeMap.get('Landroid/app/Activity;')!);
  writeUInt32LE(classDefBuf, 12, 0);
  writeUInt32LE(classDefBuf, 16, strings.indexOf('MainActivity.java'));
  writeUInt32LE(classDefBuf, 20, 0);
  writeUInt32LE(classDefBuf, 24, classDataOff);
  writeUInt32LE(classDefBuf, 28, 0);

  let mapOff = classDataOff + classDataBytes.length;
  while (mapOff % 4 !== 0) mapOff++;

  const mapItems = [
    { type: 0x0000, size: 1, offset: 0 },
    { type: 0x0001, size: stringIdsSize, offset: stringIdsOff },
    { type: 0x0002, size: typeIdsSize, offset: typeIdsOff },
    { type: 0x0003, size: protoIdsSize, offset: protoIdsOff },
    { type: 0x0005, size: methodIdsSize, offset: methodIdsOff },
    { type: 0x0006, size: classDefsSize, offset: classDefsOff },
    { type: 0x2002, size: stringIdsSize, offset: absStringDataOff },
    { type: 0x1001, size: 1, offset: typeListOff },
    { type: 0x2001, size: 2, offset: codeInitOff },
    { type: 0x2000, size: 1, offset: classDataOff },
    { type: 0x1000, size: 1, offset: mapOff },
  ];

  const mapBuf = new Uint8Array(4 + mapItems.length * 12);
  writeUInt32LE(mapBuf, 0, mapItems.length);
  mapItems.forEach((m, idx) => {
    writeUInt16LE(mapBuf, 4 + idx * 12, m.type);
    writeUInt16LE(mapBuf, 6 + idx * 12, 0);
    writeUInt32LE(mapBuf, 8 + idx * 12, m.size);
    writeUInt32LE(mapBuf, 12 + idx * 12, m.offset);
  });

  const totalFileSize = mapOff + mapBuf.length;
  const dataSize = totalFileSize - dataOff;

  const full = new Uint8Array(totalFileSize);

  // DEX magic
  const magic = [0x64, 0x65, 0x78, 0x0a, 0x30, 0x33, 0x35, 0x00];
  magic.forEach((b, i) => (full[i] = b));

  writeUInt32LE(full, 32, totalFileSize);
  writeUInt32LE(full, 36, 0x70);
  writeUInt32LE(full, 40, 0x12345678);
  writeUInt32LE(full, 44, 0);
  writeUInt32LE(full, 48, 0);
  writeUInt32LE(full, 52, mapOff);
  writeUInt32LE(full, 56, stringIdsSize);
  writeUInt32LE(full, 60, stringIdsOff);
  writeUInt32LE(full, 64, typeIdsSize);
  writeUInt32LE(full, 68, typeIdsOff);
  writeUInt32LE(full, 72, protoIdsSize);
  writeUInt32LE(full, 76, protoIdsOff);
  writeUInt32LE(full, 80, fieldIdsSize);
  writeUInt32LE(full, 84, fieldIdsOff);
  writeUInt32LE(full, 88, methodIdsSize);
  writeUInt32LE(full, 92, methodIdsOff);
  writeUInt32LE(full, 96, classDefsSize);
  writeUInt32LE(full, 100, classDefsOff);
  writeUInt32LE(full, 104, dataSize);
  writeUInt32LE(full, 108, dataOff);

  full.set(stringIdsBuf, stringIdsOff);
  full.set(typeIdsBuf, typeIdsOff);
  full.set(protoIdsBuf, protoIdsOff);
  full.set(methodIdsBuf, methodIdsOff);
  full.set(classDefBuf, classDefsOff);
  full.set(new Uint8Array(stringDataBytes), absStringDataOff);
  full.set(typeListBuf, typeListOff);
  full.set(codeInit, codeInitOff);
  full.set(codeOnCreate, codeOnCreateOff);
  full.set(new Uint8Array(classDataBytes), classDataOff);
  full.set(mapBuf, mapOff);

  // Compute SHA-1 over [32 ... end]
  const toHash = full.subarray(32);
  const hashBuffer = await crypto.subtle.digest('SHA-1', toHash);
  const sha1Bytes = new Uint8Array(hashBuffer);
  full.set(sha1Bytes, 12);

  // Compute Adler32 over [12 ... end]
  const adler = adler32(full, 12, full.length);
  writeUInt32LE(full, 8, adler);

  return full;
}
