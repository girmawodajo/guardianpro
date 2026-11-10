import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import zlib from 'zlib';
import { execSync } from 'child_process';
import { buildValidDex } from '../server/dexBuilder';

interface ZipFileItem {
  name: string;
  data: Buffer;
  method: number; // 0 = stored (uncompressed), 8 = deflated
}

export function buildApk(isCompanion: boolean): Buffer {
  const packageName = isCompanion
    ? 'com.guardianpath.child.companion'
    : 'com.guardianpath.parent.console';
  const classDescriptor = `L${packageName.replace(/\./g, '/')}/MainActivity;`;

  // 1. AndroidManifest.xml (Binary AXML)
  const manifestFile = isCompanion ? 'companion_manifest.xml' : 'parent_manifest.xml';
  const axml = fs.readFileSync(path.join(process.cwd(), 'server', 'assets', manifestFile));

  // 2. classes.dex (with <init>()V and onCreate(Bundle)V)
  const dex = buildValidDex(classDescriptor);

  // 3. Icon (res/drawable/icon.png)
  const icon = fs.readFileSync(path.join(process.cwd(), 'server', 'assets', 'icon.png'));

  // 4. resources.arsc (Mandatory for Android 11+ PackageParser compliance, uncompressed and 4-byte aligned)
  const arscFile = isCompanion ? 'companion_resources.arsc' : 'parent_resources.arsc';
  const arsc = fs.readFileSync(path.join(process.cwd(), 'server', 'assets', arscFile));

  // Payload entries to sign
  const rawEntries: { name: string; data: Buffer }[] = [
    { name: 'AndroidManifest.xml', data: axml },
    { name: 'classes.dex', data: dex },
    { name: 'res/drawable/icon.png', data: icon },
    { name: 'resources.arsc', data: arsc },
  ];

  // 5. v1 Signatures (MANIFEST.MF, KIDSGUAR.SF, KIDSGUAR.RSA)
  let manifestText = 'Manifest-Version: 1.0\r\nCreated-By: 1.0 (Android SignApk)\r\nBuilt-By: KidsGuardian Safety Hub\r\n\r\n';
  const sfSections: string[] = [];

  for (const entry of rawEntries) {
    const hash = crypto.createHash('sha256').update(entry.data).digest('base64');
    const sec = `Name: ${entry.name}\r\nSHA-256-Digest: ${hash}\r\n\r\n`;
    manifestText += sec;
    const secHash = crypto.createHash('sha256').update(sec).digest('base64');
    sfSections.push(`Name: ${entry.name}\r\nSHA-256-Digest: ${secHash}\r\n\r\n`);
  }

  const manifestBuf = Buffer.from(manifestText, 'utf8');
  const manifestHash = crypto.createHash('sha256').update(manifestBuf).digest('base64');

  // Note: Include X-Android-APK-Signed: 2 in main section of .SF file
  let sfText = `Signature-Version: 1.0\r\nCreated-By: 1.0 (Android SignApk)\r\nX-Android-APK-Signed: 2\r\nSHA-256-Digest-Manifest: ${manifestHash}\r\n\r\n`;
  sfText += sfSections.join('');
  const sfBuf = Buffer.from(sfText, 'utf8');

  // CMS/PKCS#7 signature for KIDSGUAR.RSA
  const keystore = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'server', 'keystore.json'), 'utf8'));
  const tmpSf = `/tmp/sf_${Date.now()}_${Math.random().toString(36).slice(2)}.tmp`;
  const tmpRsa = `/tmp/rsa_${Date.now()}_${Math.random().toString(36).slice(2)}.tmp`;
  const tmpKey = `/tmp/key_${Date.now()}_${Math.random().toString(36).slice(2)}.tmp`;
  const tmpCert = `/tmp/cert_${Date.now()}_${Math.random().toString(36).slice(2)}.tmp`;

  let rsaBuf: Buffer;
  try {
    fs.writeFileSync(tmpSf, sfBuf);
    fs.writeFileSync(tmpKey, keystore.keyPem);
    fs.writeFileSync(tmpCert, keystore.certPem);
    execSync(`openssl cms -sign -in "${tmpSf}" -out "${tmpRsa}" -outform DER -inkey "${tmpKey}" -signer "${tmpCert}" -binary -nosmimecap`);
    rsaBuf = fs.readFileSync(tmpRsa);
    try {
      fs.unlinkSync(tmpSf);
      fs.unlinkSync(tmpRsa);
      fs.unlinkSync(tmpKey);
      fs.unlinkSync(tmpCert);
    } catch {}
  } catch (err) {
    console.warn('Falling back to default cert RSA:', err);
    rsaBuf = Buffer.from(keystore.defaultCertRsaBase64, 'base64');
  }

  // Full entries list in APK
  // Note: resources.arsc and res/drawable/icon.png MUST be stored uncompressed (method 0) and 4-byte aligned
  const allEntries: ZipFileItem[] = [
    { name: 'AndroidManifest.xml', data: axml, method: 8 },
    { name: 'classes.dex', data: dex, method: 8 },
    { name: 'res/drawable/icon.png', data: icon, method: 0 },
    { name: 'resources.arsc', data: arsc, method: 0 },
    { name: 'META-INF/MANIFEST.MF', data: manifestBuf, method: 8 },
    { name: 'META-INF/KIDSGUAR.SF', data: sfBuf, method: 8 },
    { name: 'META-INF/KIDSGUAR.RSA', data: rsaBuf, method: 0 },
  ];

  // 6. Build ZIP binary (Section 1: Local file headers + data)
  const localHeadersAndData: Buffer[] = [];
  const cdEntries: Buffer[] = [];
  let currentOffset = 0;

  for (const entry of allEntries) {
    const fnBuf = Buffer.from(entry.name, 'utf8');
    const crc = (zlib.crc32 as any)(entry.data) >>> 0;
    const uncompSize = entry.data.length;

    let compData: Buffer;
    if (entry.method === 8) {
      compData = zlib.deflateRawSync(entry.data, { level: 9 });
    } else {
      compData = entry.data;
    }
    const compSize = compData.length;

    // Strict 4-byte alignment padding for all uncompressed entries (method 0)
    let extraBuf = Buffer.alloc(0);
    if (entry.method === 0) {
      const headerLen = 30 + fnBuf.length;
      const dataOffset = currentOffset + headerLen;
      const rem = dataOffset % 4;
      if (rem !== 0) {
        const padLen = 4 - rem;
        extraBuf = Buffer.alloc(padLen);
      }
    }

    const localHeader = Buffer.alloc(30 + fnBuf.length + extraBuf.length);
    localHeader.writeUInt32LE(0x04034b50, 0); // Local header signature
    localHeader.writeUInt16LE(20, 4); // Min version to extract (2.0)
    localHeader.writeUInt16LE(0, 6); // General purpose flags
    localHeader.writeUInt16LE(entry.method, 8); // Compression method
    localHeader.writeUInt16LE(0x5000, 10); // Mod time
    localHeader.writeUInt16LE(0x5d40, 12); // Mod date (2026)
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compSize, 18);
    localHeader.writeUInt32LE(uncompSize, 22);
    localHeader.writeUInt16LE(fnBuf.length, 26);
    localHeader.writeUInt16LE(extraBuf.length, 28);
    fnBuf.copy(localHeader, 30);
    if (extraBuf.length > 0) {
      extraBuf.copy(localHeader, 30 + fnBuf.length);
    }

    const fileBlock = Buffer.concat([localHeader, compData]);
    localHeadersAndData.push(fileBlock);

    // Central Directory Entry
    const cdEntry = Buffer.alloc(46 + fnBuf.length);
    cdEntry.writeUInt32LE(0x02014b50, 0); // CD signature
    cdEntry.writeUInt16LE(20, 4); // Version made by
    cdEntry.writeUInt16LE(20, 6); // Version needed
    cdEntry.writeUInt16LE(0, 8); // Flags
    cdEntry.writeUInt16LE(entry.method, 10);
    cdEntry.writeUInt16LE(0x5000, 12);
    cdEntry.writeUInt16LE(0x5d40, 14);
    cdEntry.writeUInt32LE(crc, 16);
    cdEntry.writeUInt32LE(compSize, 20);
    cdEntry.writeUInt32LE(uncompSize, 24);
    cdEntry.writeUInt16LE(fnBuf.length, 28);
    cdEntry.writeUInt16LE(0, 30); // Extra field len
    cdEntry.writeUInt16LE(0, 32); // File comment len
    cdEntry.writeUInt16LE(0, 34); // Disk num
    cdEntry.writeUInt16LE(0, 36); // Internal attr
    cdEntry.writeUInt32LE(0x81a40000, 38); // External attr (regular file)
    cdEntry.writeUInt32LE(currentOffset, 42); // Local header offset
    fnBuf.copy(cdEntry, 46);
    cdEntries.push(cdEntry);

    currentOffset += fileBlock.length;
  }

  const section1 = Buffer.concat(localHeadersAndData);
  const section3 = Buffer.concat(cdEntries);

  // EOCD before v2 block insertion
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // EOCD signature
  eocd.writeUInt16LE(0, 4); // Disk num
  eocd.writeUInt16LE(0, 6); // Start disk
  eocd.writeUInt16LE(allEntries.length, 8); // Entries on disk
  eocd.writeUInt16LE(allEntries.length, 10); // Total entries
  eocd.writeUInt32LE(section3.length, 12); // CD size
  eocd.writeUInt32LE(section1.length, 16); // CD offset (before v2 block)
  eocd.writeUInt16LE(0, 20); // Comment len

  // 7. Compute APK Signature Scheme v2 (APK Sig Block 42)
  const CHUNK_SIZE = 1048576;
  const sections = [section1, section3, eocd];
  const chunkDigests: Buffer[] = [];

  for (const sec of sections) {
    for (let i = 0; i < sec.length; i += CHUNK_SIZE) {
      const chunk = sec.subarray(i, Math.min(i + CHUNK_SIZE, sec.length));
      const prefix = Buffer.alloc(5);
      prefix[0] = 0x5a;
      prefix.writeUInt32LE(chunk.length, 1);
      const h = crypto.createHash('sha256').update(Buffer.concat([prefix, chunk])).digest();
      chunkDigests.push(h);
    }
  }

  const topPrefix = Buffer.alloc(5);
  topPrefix[0] = 0x5a;
  topPrefix.writeUInt32LE(chunkDigests.length, 1);
  const topDigest = crypto.createHash('sha256').update(Buffer.concat([topPrefix, ...chunkDigests])).digest();

  // Extract DER cert and pubkey via Node crypto
  const x509 = new crypto.X509Certificate(keystore.certPem);
  const certDer = x509.raw;
  const pubDer = x509.publicKey.export({ type: 'spki', format: 'der' });

  // Build signed_data
  const digestEntry = Buffer.concat([
    Buffer.from([0x03, 0x01, 0x00, 0x00]), // algo 0x0103 (SHA256withRSA)
    Buffer.from([0x20, 0x00, 0x00, 0x00]), // len 32
    topDigest,
  ]);
  const digestEntryPrefixed = Buffer.concat([Buffer.alloc(4), digestEntry]);
  digestEntryPrefixed.writeUInt32LE(digestEntry.length, 0);

  const digestsSeq = Buffer.concat([Buffer.alloc(4), digestEntryPrefixed]);
  digestsSeq.writeUInt32LE(digestEntryPrefixed.length, 0);

  const certEntryPrefixed = Buffer.concat([Buffer.alloc(4), certDer]);
  certEntryPrefixed.writeUInt32LE(certDer.length, 0);

  const certsSeq = Buffer.concat([Buffer.alloc(4), certEntryPrefixed]);
  certsSeq.writeUInt32LE(certEntryPrefixed.length, 0);

  const attrsSeq = Buffer.alloc(4);
  attrsSeq.writeUInt32LE(0, 0);

  const signedData = Buffer.concat([digestsSeq, certsSeq, attrsSeq]);
  const signedDataPrefixed = Buffer.concat([Buffer.alloc(4), signedData]);
  signedDataPrefixed.writeUInt32LE(signedData.length, 0);

  // Sign signedData with RSA private key natively via crypto.sign
  const rsaSig = crypto.sign('sha256', signedData, keystore.keyPem);

  // signatures sequence
  const sigEntry = Buffer.concat([
    Buffer.from([0x03, 0x01, 0x00, 0x00]), // algo 0x0103
    Buffer.alloc(4),
    rsaSig,
  ]);
  sigEntry.writeUInt32LE(rsaSig.length, 4);

  const sigEntryPrefixed = Buffer.concat([Buffer.alloc(4), sigEntry]);
  sigEntryPrefixed.writeUInt32LE(sigEntry.length, 0);

  const sigsSeq = Buffer.concat([Buffer.alloc(4), sigEntryPrefixed]);
  sigsSeq.writeUInt32LE(sigEntryPrefixed.length, 0);

  // public_key (length-prefixed)
  const pubKeyPrefixed = Buffer.concat([Buffer.alloc(4), pubDer]);
  pubKeyPrefixed.writeUInt32LE(pubDer.length, 0);

  // Assemble signer
  const signerContent = Buffer.concat([signedDataPrefixed, sigsSeq, pubKeyPrefixed]);
  const signerPrefixed = Buffer.concat([Buffer.alloc(4), signerContent]);
  signerPrefixed.writeUInt32LE(signerContent.length, 0);

  // Signers sequence
  const signersSeq = Buffer.concat([Buffer.alloc(4), signerPrefixed]);
  signersSeq.writeUInt32LE(signerPrefixed.length, 0);

  // Pair 0x7109871a
  const pairValue = signersSeq;
  const pairHeader = Buffer.alloc(12);
  pairHeader.writeBigUInt64LE(BigInt(pairValue.length + 4), 0);
  pairHeader.writeUInt32LE(0x7109871a, 8);

  const pairBlock = Buffer.concat([pairHeader, pairValue]);

  // APK Signing Block
  const blockSize = BigInt(pairBlock.length + 24);
  const blockHeader = Buffer.alloc(8);
  blockHeader.writeBigUInt64LE(blockSize, 0);

  const blockFooter = Buffer.alloc(24);
  blockFooter.writeBigUInt64LE(blockSize, 0);
  Buffer.from('APK Sig Block 42', 'ascii').copy(blockFooter, 8);

  const apkSigningBlock = Buffer.concat([blockHeader, pairBlock, blockFooter]);

  // 8. Update EOCD with new CD offset
  const finalEocd = Buffer.from(eocd);
  finalEocd.writeUInt32LE(section1.length + apkSigningBlock.length, 16);

  // 9. Assemble final APK
  const finalApk = Buffer.concat([section1, apkSigningBlock, section3, finalEocd]);

  return finalApk;
}
